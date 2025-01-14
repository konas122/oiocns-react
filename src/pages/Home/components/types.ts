export interface NavigationItem {
  key: string;
  name: string;
  backgroundImageUrl: string;
  type: string;
  component: any;
  id?: string;
  belongId?: string;
  tag?: string[];
  readonly?: boolean
}
