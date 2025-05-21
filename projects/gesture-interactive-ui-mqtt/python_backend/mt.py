import paho.mqtt.client as mqtt
import json
import time

# 公网 MQTT 经纪人配置（手势识别消息来源）
PUBLIC_BROKER = "broker.hivemq.com"
PUBLIC_PORT = 8884
PUBLIC_TOPIC = "gestureUI/switch/+/state"

# 局域网 MQTT 经纪人配置（Home Assistant）
LOCAL_BROKER = "192.168.2.2"
LOCAL_PORT = 1883
LOCAL_MQTT_USER = ""  # 如果需要用户名，填入
LOCAL_MQTT_PASSWORD = ""  # 如果需要密码，填入

# 按钮到继电器的映射
BUTTON_TO_RELAY = {
    "btn-0": "s3w0x7ceswitch/switch/relay1/command",  # Living Room Light -> 继电器 1
    "btn-1": "s3w0x7ceswitch/switch/relay2/command",  # Kitchen Fan -> 继电器 2
    # "btn-2": "s3w0x7ceswitch/switch/relay3/command"  # 如果有第三个继电器，可以添加
}

# 公网 MQTT 客户端回调函数
def on_connect_public(client, userdata, flags, rc, properties=None):
    print(f"已连接到公网 MQTT 经纪人 ({PUBLIC_BROKER})，结果码: {rc}")
    client.subscribe(PUBLIC_TOPIC)
    print(f"已订阅公网主题: {PUBLIC_TOPIC}")

def on_message_public(client, userdata, msg):
    print(f"收到公网消息 - 主题: {msg.topic}")
    try:
        payload = json.loads(msg.payload.decode())
        print(f"消息内容: {json.dumps(payload, indent=2, ensure_ascii=False)}")
        
        # 提取 id 和 state
        button_id = payload.get("id")
        state = payload.get("state")
        
        if not button_id or not state:
            print("错误: 消息缺少 'id' 或 'state' 字段")
            return
        
        # 检查按钮 ID 是否在映射中
        if button_id not in BUTTON_TO_RELAY:
            print(f"警告: 未知的按钮 ID '{button_id}'，忽略")
            return
        
        # 获取对应的局域网主题
        local_topic = BUTTON_TO_RELAY[button_id]
        print(f"将状态 '{state}' 转发到局域网主题: {local_topic}")
        
        # 发布到局域网 MQTT 经纪人
        local_client.publish(local_topic, state, retain=True)
        print(f"已发布到局域网: {local_topic} -> {state}")
        
    except json.JSONDecodeError as e:
        print(f"解析公网消息失败: {e}")
    except Exception as e:
        print(f"处理公网消息时出错: {e}")

# 局域网 MQTT 客户端回调函数
def on_connect_local(client, userdata, flags, rc, properties=None):
    print(f"已连接到局域网 MQTT 经纪人 ({LOCAL_BROKER})，结果码: {rc}")

def on_disconnect_local(client, userdata, rc, properties=None):
    print(f"与局域网 MQTT 经纪人断开连接，原因: {rc}")
    print("尝试重新连接...")
    reconnect_local()

# 重连局域网 MQTT 经纪人
def reconnect_local():
    while not local_client.is_connected():
        try:
            local_client.reconnect()
            print("局域网 MQTT 经纪人重连成功")
            break
        except Exception as e:
            print(f"局域网 MQTT 经纪人重连失败: {e}")
            time.sleep(5)

# 创建公网 MQTT 客户端
public_client = mqtt.Client(client_id="gesture_middleware_public", transport="websockets")
public_client.on_connect = on_connect_public
public_client.on_message = on_message_public
public_client.ws_set_options(path="/mqtt")
public_client.tls_set()  # 启用 TLS 以支持 WSS

# 创建局域网 MQTT 客户端
local_client = mqtt.Client(client_id="gesture_middleware_local")
local_client.on_connect = on_connect_local
local_client.on_disconnect = on_disconnect_local

# 如果局域网 MQTT 需要认证
if LOCAL_MQTT_USER and LOCAL_MQTT_PASSWORD:
    local_client.username_pw_set(LOCAL_MQTT_USER, LOCAL_MQTT_PASSWORD)

# 连接到公网 MQTT 经纪人
try:
    public_client.connect(PUBLIC_BROKER, PUBLIC_PORT, 60)
    print(f"正在连接到公网 MQTT 经纪人: {PUBLIC_BROKER}:{PUBLIC_PORT}")
except Exception as e:
    print(f"连接公网 MQTT 经纪人失败: {e}")
    exit()

# 连接到局域网 MQTT 经纪人
try:
    local_client.connect(LOCAL_BROKER, LOCAL_PORT, 60)
    print(f"正在连接到局域网 MQTT 经纪人: {LOCAL_BROKER}:{LOCAL_PORT}")
except Exception as e:
    print(f"连接局域网 MQTT 经纪人失败: {e}")
    exit()

# 启动网络循环
print("启动 MQTT 中间件...")
public_client.loop_start()  # 在后台运行公网客户端循环
local_client.loop_start()   # 在后台运行局域网客户端循环

# 保持脚本运行
try:
    while True:
        time.sleep(1)  # 主线程保持运行
except KeyboardInterrupt:
    print("正在退出...")
    public_client.loop_stop()
    public_client.disconnect()
    local_client.loop_stop()
    local_client.disconnect()