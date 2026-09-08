import React from 'react';
import {
  CandlestickChart,
  Wallet,
  Trophy,
  AlertTriangle,
  Camera,
  Trash2,
  Terminal,
  HelpCircle,
  Minimize2,
  Maximize2,
  X,
  Volume2,
  VolumeX,
  Radio,
  CheckCircle,
  Gift,
  Lock,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';

interface PixelIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const PixelIcon: React.FC<PixelIconProps> = ({ name, className = '', size = 16 }) => {
  switch (name) {
    case 'candlestick':
      return <CandlestickChart size={size} className={className} />;
    case 'wallet':
      return <Wallet size={size} className={className} />;
    case 'trophy':
      return <Trophy size={size} className={className} />;
    case 'warning':
      return <AlertTriangle size={size} className={className} />;
    case 'camera':
      return <Camera size={size} className={className} />;
    case 'trash':
      return <Trash2 size={size} className={className} />;
    case 'terminal':
      return <Terminal size={size} className={className} />;
    case 'help':
      return <HelpCircle size={size} className={className} />;
    case 'minimize':
      return <Minimize2 size={size} className={className} />;
    case 'maximize':
      return <Maximize2 size={size} className={className} />;
    case 'close':
      return <X size={size} className={className} />;
    case 'volume_on':
      return <Volume2 size={size} className={className} />;
    case 'volume_off':
      return <VolumeX size={size} className={className} />;
    case 'radio':
      return <Radio size={size} className={className} />;
    case 'check':
      return <CheckCircle size={size} className={className} />;
    case 'gift':
      return <Gift size={size} className={className} />;
    case 'lock':
      return <Lock size={size} className={className} />;
    case 'arrow_up':
      return <ArrowUp size={size} className={className} />;
    case 'arrow_down':
      return <ArrowDown size={size} className={className} />;
    case 'sparkles':
      return <Sparkles size={size} className={className} />;
    default:
      return <Terminal size={size} className={className} />;
  }
};
