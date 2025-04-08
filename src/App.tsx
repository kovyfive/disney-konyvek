import React, { JSX, useState } from 'react';
import { Input, Button, Slider, Select, Space, Typography, Layout, Card } from 'antd';
import 'antd/dist/reset.css';
import './App.css';

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;
const { Sider, Content } = Layout;

interface ColorItem {
  title: string;
  r: number;
  g: number;
  b: number;
}

function luminosity(r: number, g: number, b: number): number {
  return Math.sqrt(0.241 * r + 0.691 * g + 0.068 * b);
}

function rgbToHSV(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, v];
}

function rgbToHLS(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s=0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, l, s];
}

function stepSort(r: number, g: number, b: number, repetitions = 8): [number, number, number] {
  const lum = luminosity(r, g, b);
  const [h, s, v] = rgbToHSV(r, g, b);
  let h2 = Math.floor(h * repetitions);
  let v2 = Math.floor(v * repetitions);
  let lum2 = Math.floor(lum * repetitions);
  if (h2 % 2 === 1) {
    v2 = repetitions - v2;
    lum2 = repetitions - lum2;
  }
  return [h2, lum2, v2];
}

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<JSX.Element[]>([]);
  const [groupCount, setGroupCount] = useState(1);
  const [sortMethod, setSortMethod] = useState('luminosity');

  const handleSort = () => {
    const lines = input.trim().split('\n');
    let items: ColorItem[] = [];

    for (const line of lines) {
      const match = line.match(/(.+)\s+rgb\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const title = match[1].trim();
        const r = parseInt(match[2]), g = parseInt(match[3]), b = parseInt(match[4]);
        items.push({ title, r, g, b });
      }
    }

    switch (sortMethod) {
      case 'hsv':
        items.sort((a, b) => {
          const [ha] = rgbToHSV(a.r, a.g, a.b);
          const [hb] = rgbToHSV(b.r, b.g, b.b);
          return ha - hb;
        });
        break;
      case 'hls':
        items.sort((a, b) => {
          const [ha] = rgbToHLS(a.r, a.g, a.b);
          const [hb] = rgbToHLS(b.r, b.g, b.b);
          return ha - hb;
        });
        break;
      case 'step':
        items.sort((a, b) => {
          const sa = stepSort(a.r, a.g, a.b);
          const sb = stepSort(b.r, b.g, b.b);
          return sa.toString().localeCompare(sb.toString());
        });
        break;
      case 'invertedStep':
        items.sort((a, b) => {
          const sa = stepSort(a.r, a.g, a.b);
          const sb = stepSort(b.r, b.g, b.b);
          return sb.toString().localeCompare(sa.toString());
        });
        break;
      case 'luminosity':
      default:
        items.sort((a, b) => luminosity(a.r, a.g, a.b) - luminosity(b.r, b.g, b.b));
    }

    const groups: ColorItem[][] = Array.from({ length: groupCount }, () => []);
    const minLum = Math.min(...items.map(i => luminosity(i.r, i.g, i.b)));
    const maxLum = Math.max(...items.map(i => luminosity(i.r, i.g, i.b)));
    const lumRange = maxLum - minLum;

    for (const item of items) {
      const lum = luminosity(item.r, item.g, item.b);
      const groupIndex = lumRange === 0 ? 0 : Math.min(groupCount - 1, Math.floor(((lum - minLum) / lumRange) * groupCount));
      groups[groupIndex].push(item);
    }

    const result: JSX.Element[] = [];
    groups.forEach((group, index) => {
      if (index > 0) {
        result.push(<div key={`divider-${index}`} style={{ height: 5, backgroundColor: '#000' }} />);
      }
      group.forEach((item, idx) => {
        result.push(
          <div
            key={`stripe-${index}-${idx}`}
            style={{
              backgroundColor: `rgb(${item.r},${item.g},${item.b})`,
              color: 'white',
              fontWeight: 'bold',
              padding: '10px 16px'
            }}
          >
            {item.title}
          </div>
        );
      });
    });

    setOutput(result);
  };

  return (
    <Layout style={{ minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' }}>
      <Sider width="30%" style={{ padding: 20, background: '#f5f5f5' }}>
        <Title level={4}>Book Color Input</Title>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste lines like: book title rgb(233,24,22)"
          rows={28}
        />
      </Sider>
      <Content style={{ padding: 20 }}>
        <Space direction="vertical" style={{ marginBottom: 20 }}>
          <Title level={4}>Sorting Options</Title>
          <Space>
            <Select defaultValue={sortMethod} onChange={(val) => setSortMethod(val)} style={{ width: 180 }}>
              <Option value="luminosity">Luminosity</Option>
              <Option value="hsv">HSV</Option>
              <Option value="hls">HLS</Option>
              <Option value="step">Step Sorting</Option>
              <Option value="invertedStep">Inverted Step</Option>
            </Select>
            <Slider
              min={1}
              max={4}
              value={groupCount}
              onChange={(val) => setGroupCount(val)}
              style={{ width: 200 }}
            />
            <Button type="primary" onClick={handleSort}>
              Sort Now
            </Button>
          </Space>
        </Space>
        <Card style={{ maxHeight: '80vh', overflowY: 'auto', borderRadius: 12 }}>
          {output}
        </Card>
      </Content>
    </Layout>
  );
};

export default App;