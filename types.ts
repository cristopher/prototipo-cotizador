
export interface EstadoPropiedad {
  estado_id: number;
  nombre_estado: 'disponible' | 'reservado' | 'vendido';
  fecha_estado: string;
}

export interface PrecioExterno {
  valor: number;
  moneda: string;
  fecha_desde: string;
  fecha_hasta: string;
}

export interface Descuento {
  valor: number;
  moneda: string;
  fecha_desde: string;
  fecha_hasta: string;
}

export interface Propiedad {
  empresa_id: string;
  pais: string;
  region: string;
  comuna: string;
  ciudad: string;
  tipo: 'casa' | 'departamento' | 'terreno';
  modelo: string;
  nombre: string;
  direccion: string;
  foto: string;
  numero: string;
  estado: EstadoPropiedad[];
  orientacion: string | null;
  piso: number | null;
  precio_venta_interno: number;
  precio_venta_externo: PrecioExterno[];
  superficie_util: number;
  superficie_total: number;
  superficie_interior: number;
  terraza: number;
  logia: number;
  dormitorios: number | null;
  banos: number | null;
  descuento_autorizado: number;
  descuento: Descuento[];
  categoria: 'economica' | 'exclusiva';
  destacada: boolean;
}

export interface ItemCotizacion extends Propiedad {
  cantidad: number;
}

export interface DatosCliente {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export interface Totales {
  precioSinDescuento: number;
  descuentoTotal: number;
  total: number;
}

export interface SimulacionCredito {
  montoCredito: number;
  cuotaMensual: number;
  interesTotal: number;
  totalPagos: number;
  rentaRequerida: number;
}
