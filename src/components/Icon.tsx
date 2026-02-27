import type { CSSProperties } from 'react';
import { Edit3, ExternalLink, Grip, Menu, Plus, Trash2 } from 'lucide-react';

type IconName = 'menu' | 'edit' | 'trash' | 'plus' | 'open' | 'grip';

type IconProps = {
  name: IconName;
  size?: number;
  style?: CSSProperties;
};

export function Icon({ name, size = 16, style }: IconProps) {
  const props = { size, style, strokeWidth: 2.2 };

  if (name === 'menu') return <Menu {...props} aria-hidden="true" />;
  if (name === 'edit') return <Edit3 {...props} aria-hidden="true" />;
  if (name === 'trash') return <Trash2 {...props} aria-hidden="true" />;
  if (name === 'plus') return <Plus {...props} aria-hidden="true" />;
  if (name === 'grip') return <Grip {...props} aria-hidden="true" />;
  return <ExternalLink {...props} aria-hidden="true" />;
}
