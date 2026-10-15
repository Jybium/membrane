import 'vite/client';

declare module '@mui/icons-material' {
  import { SvgIconProps } from '@mui/material';
  import { ComponentType } from 'react';
  const icon: ComponentType<SvgIconProps>;
  export const AddCircleOutline: ComponentType<SvgIconProps>;
  export const CancelOutlined: ComponentType<SvgIconProps>;
  export const CheckCircle: ComponentType<SvgIconProps>;
  export const CheckCircleOutline: ComponentType<SvgIconProps>;
  export const ErrorOutline: ComponentType<SvgIconProps>;
  export const Science: ComponentType<SvgIconProps>;
  export const People: ComponentType<SvgIconProps>;
  export const LocalHospital: ComponentType<SvgIconProps>;
  export const Storage: ComponentType<SvgIconProps>;
  export const AccountBalanceWallet: ComponentType<SvgIconProps>;
  export const Public: ComponentType<SvgIconProps>;
  export const Shield: ComponentType<SvgIconProps>;
  export const Lock: ComponentType<SvgIconProps>;
  export const Verified: ComponentType<SvgIconProps>;
  export const VerifiedUser: ComponentType<SvgIconProps>;
  export const HowToReg: ComponentType<SvgIconProps>;
  export const WarningAmber: ComponentType<SvgIconProps>;
  export const Security: ComponentType<SvgIconProps>;
  export const Code: ComponentType<SvgIconProps>;
  export const AccountTree: ComponentType<SvgIconProps>;
  export default icon;
}

declare module '@mui/icons-material/*' {
  import { SvgIconProps } from '@mui/material';
  import { ComponentType } from 'react';
  const icon: ComponentType<SvgIconProps>;
  export default icon;
}
