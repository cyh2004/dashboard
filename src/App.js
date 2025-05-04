import { Col, Row, Statistic, Layout, ConfigProvider, Card } from 'antd';
import React, { useState, useEffect } from 'react';
import { fetchOrgs, fetchGrouplist, fetchDevices, fetchDeviceState, fetchDevicePacket } from './api';
import './App.css';
const { Content } = Layout;

// 将 16 进制字符串转为普通字符串
const hexToString = (hex) => {
  // 移除可能存在的空格和前缀
  const cleanHex = hex.replace(/\s|0x/g, '');
  
  // 验证是否为有效16进制
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new Error('无效的16进制输入');
  }

  // 补全偶数长度
  const paddedHex = cleanHex.length % 2 !== 0 
    ? '0' + cleanHex 
    : cleanHex;

  // 转换核心逻辑
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(paddedHex.substr(i * 2, 2), 16);
    if (isNaN(byte)) throw new Error('无效的16进制字符');
    bytes[i] = byte;
  }
  
  return new TextDecoder().decode(bytes);
};

const parseStringToArray = (str) => {
  try {
    // 1. 预处理字符串（移除空格）
    const cleanedStr = str.replace(/\s/g, '');
    
    // 2. 安全解析JSON
    const result = JSON.parse(cleanedStr);
    
    // 3. 验证是否为数组
    if (!Array.isArray(result)) {
      throw new Error('输入不是有效的数组格式');
    }
    
    // 4. 验证所有元素为数字
    const hasInvalidElements = result.some(item => 
      typeof item !== 'number' || isNaN(item)
    );
    
    if (hasInvalidElements) {
      throw new Error('数组中包含非数字元素');
    }
    
    return result;
  } catch (err) {
    throw new Error(`解析失败: ${err.message}`);
  }
};

function App() {
  // eslint-disable-next-line
  const [data, setData] = useState([]);
  // eslint-disable-next-line
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line
  const [error, setError] = useState(null);
  const [state, setState] = useState({text: "", icon: "alarm_blue.svg"});

  useEffect(() => {
    if (data.length > 0){
      if (data[7] === 0){
        setState({text: "正常", icon: "alarm_blue.svg"})
      } else if (data[7] === 1){
        setState({text: "报警", icon: "alarm_red.svg"})
      }
    }
  }, [data]);

  useEffect(() => {
    const getData = async () => {
      try {
        const orgs = await fetchOrgs();
        if (orgs.data.code !== 200) {
          throw new Error(`获取组织列表失败: ${orgs.data.message}`);
        }
        const group = await fetchGrouplist(orgs.data.data[0].id);
        if (group.data.code !== 200) {
          throw new Error(`获取分组列表失败: ${group.data.message}`);
        }
        const devices = await fetchDevices(orgs.data.data[0].id, group.data.data[0].id);
        if (devices.data.code !== 200) {
          throw new Error(`获取设备列表失败: ${devices.data.message}`);
        }
        let deviceState = null;
        let deviceNumber = null;
        for (let i = 0; i < devices.data.data.length; i++) {
          deviceState = await fetchDeviceState(orgs.data.data[0].id, devices.data.data[i].id);
          if (deviceState.data.code !== 200) {
            throw new Error(`获取设备状态失败: ${deviceState.data.message}`);
          }
          if (deviceState.data.data === "disconnected") {
            continue;
          } else if (deviceState.data.data === "notbind") {
            continue;
          } else {
            deviceNumber = devices.data.data[i].number;
            break
          }
        }
        if (deviceNumber === null) {
          throw new Error(`没有已连接的设备`);
        }
        const devicePacket = await fetchDevicePacket(orgs.data.data[0].id, deviceNumber);
        if (devicePacket.data.code !== 200) {
          throw new Error(`获取设备数据包失败: ${devicePacket.data.message}`);
        }
        if (devicePacket.data.data.total_item <= 0) {
          throw new Error(`未收到数据`);
        }
        let json_str = hexToString(devicePacket.data.data.items[0].hex_packet);
        console.log(json_str);
        let array = parseStringToArray(json_str);
        console.log(array);
        setData(array);
      } catch (err) {
        setError(err.message || '请求失败');
      } finally {
        setLoading(false);
      }
    };

    getData();
  }, []);

  if (error !== null) {
    return <div>请求失败: {error}</div>;
  }

  return (
    <Layout>
      <Content
        style={{
          maxWidth: "60%",
          margin: "0 auto",
          padding: "24px",
          minHeight: "100vh"
        }}
      >
        <ConfigProvider
          theme={{
            components: {
              Statistic: {
                contentFontSize: 36,
                titleFontSize: 24
              },
            },
          }}
        >
          <Row gutter={[8, 8]}>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src="/temperature.svg" alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="温度" value={data[0]} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src="/humid.svg" alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="湿度" value={data[1]} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src="/voltage.svg" alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="电压" value={data[2]} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src="/electric.svg" alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="电流" value={data[3]} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src="/louelectric.svg" alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="漏电流" value={data[4]} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src="/yougong.svg" alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="有功功率" value={data[5]} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src="/wugong.svg" alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="无功功率" value={data[6]} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
            <Col span={12}>
            <Card style={{minWidth: "225px"}}>
              <Statistic loading={loading} prefix={<img src={state.icon} alt="Icon" style={{width: "36px", height: "36px", verticalAlign: "top"}}></img>} title="状态" value={state} valueStyle={{lineHeight: "1"}} />
            </Card>
            </Col>
          </Row>
        </ConfigProvider>
      </Content>
    </Layout>
  );
}

export default App;
