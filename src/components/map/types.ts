export interface MapMarker {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  address: string;
  slug: string;
  district?: string | null;
  detailUrl: string;
  rating?: number | null;
  reviewCount?: number;
}

export interface MapProviderProps {
  markers: MapMarker[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  activeMarkerId?: string | null;
  onMarkerSelect?: (marker: MapMarker) => void;
  locale?: string;
}

export type MapProviderComponent = React.ComponentType<MapProviderProps>;
