import React from 'react'
import {
  AwardIcon,
  EyeIcon,
  FactoryIcon,
  FlaskConicalIcon,
  GaugeIcon,
  GlobeIcon,
  HandshakeIcon,
  type LucideProps,
  ScaleIcon,
  ShieldCheckIcon,
  TargetIcon,
  TruckIcon,
  WalletIcon,
} from 'lucide-react'

const icons = {
  award: AwardIcon,
  eye: EyeIcon,
  factory: FactoryIcon,
  flask: FlaskConicalIcon,
  gauge: GaugeIcon,
  globe: GlobeIcon,
  handshake: HandshakeIcon,
  scale: ScaleIcon,
  shield: ShieldCheckIcon,
  target: TargetIcon,
  truck: TruckIcon,
  wallet: WalletIcon,
}

export const BrandIcon: React.FC<{ icon?: string | null } & LucideProps> = ({ icon, ...props }) => {
  const Icon = icons[(icon || 'globe') as keyof typeof icons] || GlobeIcon
  return <Icon {...props} />
}
