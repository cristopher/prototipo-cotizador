
import { Propiedad } from './types.ts';
import { VALOR_UF } from './constants.ts';

export const formatUF = (value: number) => {
  return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatCLP = (value: number) => {
  return value.toLocaleString('es-CL');
};

export const calcularPrecioVenta = (propiedad: Propiedad) => {
  const precioExterno = propiedad.precio_venta_externo[0]?.valor || 0;
  const descuento = propiedad.descuento[0]?.valor || 0;
  return precioExterno - descuento;
};
