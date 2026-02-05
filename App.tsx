
import React, { useState, useMemo } from 'react';
import { 
  Download, Plus, Minus, X, Building2, MapPin, Bed, Bath, 
  Maximize, Phone, Globe, ChevronRight, Calculator, Home, ArrowLeft
} from 'lucide-react';
import { PROPIEDADES_EJEMPLO, VALOR_UF } from './constants.ts';
import { Propiedad, ItemCotizacion, DatosCliente, Totales, SimulacionCredito } from './types.ts';
import { formatUF, formatCLP, calcularPrecioVenta } from './utils.ts';

// Global declaration for jsPDF from CDN
declare global {
  interface Window {
    jspdf: any;
  }
}

const App: React.FC = () => {
  const [propiedadesSeleccionadas, setPropiedadesSeleccionadas] = useState<ItemCotizacion[]>([]);
  const [vistaActual, setVistaActual] = useState<'catalogo' | 'cotizacion'>('catalogo');
  const [pie, setPie] = useState(20);
  const [creditoHipotecario, setCreditoHipotecario] = useState(80);
  const [aporteAdicional, setAporteAdicional] = useState(0);
  const [plazoCredito, setPlazoCredito] = useState(20);
  const [tasaInteres, setTasaInteres] = useState(6.5);
  const [datosCliente, setDatosCliente] = useState<DatosCliente>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: ''
  });

  const agregarPropiedad = (propiedad: Propiedad) => {
    const yaSeleccionada = propiedadesSeleccionadas.find(p => 
      p.direccion === propiedad.direccion && p.numero === propiedad.numero
    );
    
    if (yaSeleccionada) {
      setPropiedadesSeleccionadas(prev => 
        prev.map(p => 
          p.direccion === propiedad.direccion && p.numero === propiedad.numero
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        )
      );
    } else {
      setPropiedadesSeleccionadas(prev => [...prev, { ...propiedad, cantidad: 1 }]);
    }
    setVistaActual('cotizacion');
  };

  const eliminarPropiedad = (index: number) => {
    setPropiedadesSeleccionadas(prev => prev.filter((_, i) => i !== index));
  };

  const cambiarCantidad = (index: number, delta: number) => {
    setPropiedadesSeleccionadas(prev => 
      prev.map((p, i) => {
        if (i === index) {
          const nuevaCantidad = Math.max(1, p.cantidad + delta);
          return { ...p, cantidad: nuevaCantidad };
        }
        return p;
      })
    );
  };

  const totales = useMemo<Totales>(() => {
    const subtotal = propiedadesSeleccionadas.reduce((acc, prop) => {
      return acc + (calcularPrecioVenta(prop) * prop.cantidad);
    }, 0);

    const descuentoTotal = propiedadesSeleccionadas.reduce((acc, prop) => {
      const descuento = prop.descuento[0]?.valor || 0;
      return acc + (descuento * prop.cantidad);
    }, 0);

    const precioSinDescuento = propiedadesSeleccionadas.reduce((acc, prop) => {
      const precioExterno = prop.precio_venta_externo[0]?.valor || 0;
      return acc + (precioExterno * prop.cantidad);
    }, 0);

    return {
      precioSinDescuento,
      descuentoTotal,
      total: subtotal
    };
  }, [propiedadesSeleccionadas]);

  const ajustarPorcentaje = (tipo: 'pie' | 'credito' | 'aporte', valor: string) => {
    const nuevoValor = Math.max(0, Math.min(100, parseFloat(valor) || 0));
    
    if (tipo === 'pie') {
      setPie(nuevoValor);
      setCreditoHipotecario(100 - nuevoValor);
    } else if (tipo === 'credito') {
      setCreditoHipotecario(nuevoValor);
      setPie(100 - nuevoValor);
    }
  };

  const simulacionCredito = useMemo<SimulacionCredito>(() => {
    const montoCredito = totales.total * (creditoHipotecario / 100);
    const tasaMensual = tasaInteres / 100 / 12;
    const numPagos = plazoCredito * 12;
    
    const cuotaMensual = montoCredito > 0 ? (montoCredito * 
      (tasaMensual * Math.pow(1 + tasaMensual, numPagos)) / 
      (Math.pow(1 + tasaMensual, numPagos) - 1)) : 0;
    
    const totalPagos = cuotaMensual * numPagos;
    const interesTotal = totalPagos - montoCredito;
    const rentaRequerida = cuotaMensual / 0.25;
    
    return {
      montoCredito,
      cuotaMensual,
      interesTotal,
      totalPagos,
      rentaRequerida
    };
  }, [totales.total, creditoHipotecario, plazoCredito, tasaInteres]);

  const generarPDF = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    let yPos = 20;
    
    // Header colors
    doc.setFillColor(15, 23, 42); // Slate 900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('ELITE ESTATES', 20, 25);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Propiedades Exclusivas & Inversiones', 20, 32);
    
    yPos = 55;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('COTIZACIÓN DE PROPIEDADES', 20, yPos);
    yPos += 15;
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Información del Cliente:', 20, yPos);
    yPos += 8;
    
    doc.setFont(undefined, 'normal');
    doc.text(`Nombre: ${datosCliente.nombre || 'N/A'} ${datosCliente.apellido || ''}`, 20, yPos);
    yPos += 6;
    doc.text(`Email: ${datosCliente.email || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Teléfono: ${datosCliente.telefono || 'N/A'}`, 20, yPos);
    yPos += 6;
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, 20, yPos);
    yPos += 15;
    
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('Detalle de Propiedades', 20, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    propiedadesSeleccionadas.forEach((prop, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      const pVenta = calcularPrecioVenta(prop);
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${prop.nombre} - ${prop.modelo}`, 20, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');
      doc.text(`${prop.direccion}, ${prop.comuna}`, 25, yPos);
      yPos += 6;
      doc.text(`Cantidad: ${prop.cantidad} | Unitario: ${formatUF(pVenta)} UF | Total: ${formatUF(pVenta * prop.cantidad)} UF`, 25, yPos);
      yPos += 10;
    });
    
    yPos += 5;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMEN ECONÓMICO', 20, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Subtotal sin descuentos: ${formatUF(totales.precioSinDescuento)} UF`, 20, yPos);
    yPos += 6;
    doc.setTextColor(22, 163, 74); // Green 600
    doc.text(`Descuento aplicado: -${formatUF(totales.descuentoTotal)} UF`, 20, yPos);
    yPos += 8;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`INVERSIÓN TOTAL: ${formatUF(totales.total)} UF`, 20, yPos);
    yPos += 15;
    
    if (creditoHipotecario > 0) {
      doc.setFontSize(12);
      doc.text('Simulación de Financiamiento', 20, yPos);
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Financiamiento Bancario (${creditoHipotecario}%): ${formatUF(simulacionCredito.montoCredito)} UF`, 20, yPos);
      yPos += 6;
      doc.text(`Pie / Enganche (${pie}%): ${formatUF(totales.total * pie / 100)} UF`, 20, yPos);
      yPos += 6;
      doc.text(`Plazo: ${plazoCredito} años a una tasa del ${tasaInteres}% anual`, 20, yPos);
      yPos += 8;
      doc.setFont(undefined, 'bold');
      doc.text(`DIVIDENDO MENSUAL ESTIMADO: ${simulacionCredito.cuotaMensual.toFixed(2)} UF`, 20, yPos);
    }
    
    doc.save(`Elite_Estates_Cotizacion_${Date.now()}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setVistaActual('catalogo')}
          >
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none">ELITE ESTATES</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-1">Premium Real Estate</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-10 text-sm font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-blue-500 transition-colors">Ventas</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Arriendos</a>
            <a href="#" className="hover:text-blue-500 transition-colors">Inversionistas</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setVistaActual(v => v === 'catalogo' ? 'cotizacion' : 'catalogo')}
              className="relative flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/20"
            >
              {vistaActual === 'catalogo' ? (
                <>
                  <Calculator className="w-4 h-4" />
                  <span className="hidden sm:inline">Ver Cotización</span>
                  {propiedadesSeleccionadas.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-[10px] flex items-center justify-center rounded-full border-2 border-slate-900">
                      {propiedadesSeleccionadas.length}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4" />
                  <span>Volver al Catálogo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {vistaActual === 'catalogo' ? (
          <div className="space-y-12 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {['economica', 'exclusiva'].map((cat) => (
                <section key={cat}>
                  <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
                    <div>
                      <span className="text-blue-600 font-black uppercase text-xs tracking-[0.2em] mb-1 block">Colección</span>
                      <h3 className="text-3xl font-black text-slate-900 capitalize">
                        {cat === 'economica' ? 'Oportunidades de Valor' : 'Propiedades Elite'}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {PROPIEDADES_EJEMPLO.filter(p => p.categoria === cat).map((prop, i) => (
                      <PropertyCard key={i} propiedad={prop} onAdd={agregarPropiedad} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in slide-in-from-right duration-500">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Calculator className="w-7 h-7 text-blue-600" />
                    Propiedades Seleccionadas
                  </h3>
                  <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {propiedadesSeleccionadas.length} Propiedades
                  </span>
                </div>

                <div className="p-8">
                  {propiedadesSeleccionadas.length === 0 ? (
                    <div className="text-center py-20 flex flex-col items-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Home className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold text-lg mb-8">No has seleccionado ninguna propiedad todavía.</p>
                      <button 
                        onClick={() => setVistaActual('catalogo')}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                      >
                        <ChevronRight className="w-5 h-5" />
                        Explorar el Catálogo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {propiedadesSeleccionadas.map((prop, idx) => (
                        <div key={idx} className="flex flex-col sm:flex-row gap-6 p-6 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                          <img 
                            src={prop.foto} 
                            className="w-full sm:w-32 h-40 sm:h-32 object-cover rounded-xl shadow-md"
                            alt={prop.nombre}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{prop.nombre}</h4>
                                <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  {prop.direccion}, {prop.comuna}
                                </p>
                              </div>
                              <button 
                                onClick={() => eliminarPropiedad(idx)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 mt-auto">
                              <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                <button 
                                  onClick={() => cambiarCantidad(idx, -1)}
                                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-blue-600 transition-all disabled:opacity-30"
                                  disabled={prop.cantidad <= 1}
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center font-black text-slate-900">{prop.cantidad}</span>
                                <button 
                                  onClick={() => cambiarCantidad(idx, 1)}
                                  className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <div className="text-right">
                                <span className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Subtotal</span>
                                <span className="text-xl font-black text-blue-600">
                                  UF {formatUF(calcularPrecioVenta(prop) * prop.cantidad)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {propiedadesSeleccionadas.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 space-y-10">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Globe className="w-7 h-7 text-blue-600" />
                    Simulador Hipotecario Premium
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                      <Slider 
                        label="Pie (Enganche)" 
                        value={pie} 
                        onChange={(v) => ajustarPorcentaje('pie', v)} 
                        suffix="%" 
                        color="blue"
                      />
                      <Slider 
                        label="Crédito Hipotecario" 
                        value={creditoHipotecario} 
                        onChange={(v) => ajustarPorcentaje('credito', v)} 
                        suffix="%" 
                        color="emerald"
                      />
                      
                      <div className="grid grid-cols-2 gap-6 pt-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Plazo (Años)</label>
                          <select 
                            value={plazoCredito}
                            onChange={(e) => setPlazoCredito(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          >
                            {[10, 15, 20, 25, 30].map(v => <option key={v} value={v}>{v} años</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tasa (%) Anual</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            value={tasaInteres} 
                            onChange={(e) => setTasaInteres(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-10 -mt-10"></div>
                      <div className="relative z-10">
                        <p className="text-blue-400 font-black uppercase text-[10px] tracking-widest mb-4">Proyección de Financiamiento</p>
                        <div className="space-y-6">
                          <div>
                            <span className="block text-slate-400 text-sm font-bold mb-1">Monto del Crédito</span>
                            <span className="text-3xl font-black">UF {formatUF(simulacionCredito.montoCredito)}</span>
                          </div>
                          <div className="pt-6 border-t border-slate-800">
                            <span className="block text-blue-400 text-sm font-bold mb-1">Dividendo Mensual</span>
                            <span className="text-4xl font-black text-white">UF {simulacionCredito.cuotaMensual.toFixed(2)}</span>
                            <p className="text-xs text-slate-400 mt-2">Equivalente a approx. ${formatCLP(Math.round(simulacionCredito.cuotaMensual * VALOR_UF))}</p>
                          </div>
                          <div>
                            <span className="block text-slate-400 text-sm font-bold mb-1">Renta Mínima Requerida</span>
                            <span className="text-lg font-bold">UF {simulacionCredito.rentaRequerida.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-8 text-[10px] text-slate-500 leading-relaxed font-medium">
                        * Valores referenciales. Sujetos a evaluación comercial del banco. 
                        No incluyen seguros obligatorios.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sticky top-32">
                <h3 className="text-2xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">Resumen Inversión</h3>
                
                <div className="space-y-4 mb-10">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-slate-500">Valor Propiedades</span>
                    <span className="font-black text-slate-900">UF {formatUF(totales.precioSinDescuento)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-emerald-600">
                    <span className="font-bold">Ahorro / Descuento</span>
                    <span className="font-black">- UF {formatUF(totales.descuentoTotal)}</span>
                  </div>
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex justify-between items-end">
                      <span className="text-lg font-black text-slate-900">Total</span>
                      <div className="text-right">
                        <span className="block text-4xl font-black text-blue-600">UF {formatUF(totales.total)}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 block">
                          ${formatCLP(totales.total * VALOR_UF)} CLP
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 mb-10">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Datos del Contacto</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        type="text" placeholder="Nombre" 
                        value={datosCliente.nombre} onChange={e => setDatosCliente({...datosCliente, nombre: e.target.value})}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                      />
                      <input 
                        type="text" placeholder="Apellido" 
                        value={datosCliente.apellido} onChange={e => setDatosCliente({...datosCliente, apellido: e.target.value})}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                      />
                    </div>
                    <input 
                      type="email" placeholder="Email de contacto" 
                      value={datosCliente.email} onChange={e => setDatosCliente({...datosCliente, email: e.target.value})}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                    />
                    <input 
                      type="tel" placeholder="+56 9 XXXX XXXX" 
                      value={datosCliente.telefono} onChange={e => setDatosCliente({...datosCliente, telefono: e.target.value})}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none w-full"
                    />
                  </div>
                </div>

                <button 
                  onClick={generarPDF}
                  disabled={propiedadesSeleccionadas.length === 0}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl flex items-center justify-center gap-3 transform hover:-translate-y-1 active:translate-y-0"
                >
                  <Download className="w-5 h-5" />
                  Descargar Informe
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 text-white pt-20 pb-10 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-black tracking-tighter">ELITE ESTATES</h2>
              </div>
              <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-10">
                Líderes en gestión inmobiliaria premium con un enfoque tecnológico y transparente.
              </p>
              <div className="flex gap-4">
                <SocialLink icon={<Globe />} />
                <SocialLink icon={<Phone />} />
              </div>
            </div>
            <div>
              <h4 className="font-black text-white uppercase text-xs tracking-widest mb-8">Navegación</h4>
              <ul className="space-y-4 text-slate-400 font-bold">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Ventas Premium</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Inversionistas</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Financiamiento</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-white uppercase text-xs tracking-widest mb-8">Contacto</h4>
              <ul className="space-y-4 text-slate-400 font-bold">
                <li className="flex items-center gap-2 underline decoration-blue-500/50 underline-offset-4">contacto@eliteestates.com</li>
                <li>+56 2 2345 6789</li>
                <li className="text-slate-500 text-sm">Av. Alonso de Córdova 5670,<br /> Vitacura, Chile.</li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <p>© 2025 ELITE ESTATES. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Internal Components
const PropertyCard: React.FC<{ propiedad: Propiedad, onAdd: (p: Propiedad) => void }> = ({ propiedad, onAdd }) => {
  const pVenta = calcularPrecioVenta(propiedad);
  const pOriginal = propiedad.precio_venta_externo[0]?.valor || 0;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={propiedad.foto} 
          alt={propiedad.nombre} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          {propiedad.destacada && (
            <span className="bg-yellow-400 text-slate-900 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
              ⭐ Premium
            </span>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-black text-lg drop-shadow-md">{propiedad.nombre}</p>
          <p className="text-blue-300 text-xs font-bold flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {propiedad.comuna}
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
          <span className="flex items-center gap-1"><Bed className="w-3.5 h-3.5" /> {propiedad.dormitorios || 0} Dorm.</span>
          <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" /> {propiedad.banos || 0} Baños</span>
          <span className="flex items-center gap-1"><Maximize className="w-3.5 h-3.5" /> {propiedad.superficie_total}m²</span>
        </div>

        <div className="mt-auto pt-6 border-t border-slate-50 flex items-end justify-between">
          <div>
            <p className="text-slate-300 text-xs font-black line-through mb-1">UF {formatUF(pOriginal)}</p>
            <p className="text-2xl font-black text-slate-900">UF {formatUF(pVenta)}</p>
          </div>
          <button 
            onClick={() => onAdd(propiedad)}
            className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:rotate-6 transition-all shadow-lg active:scale-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Slider: React.FC<{ label: string, value: number, onChange: (v: string) => void, suffix: string, color: 'blue' | 'emerald' }> = ({ label, value, onChange, suffix, color }) => {
  const colors = {
    blue: 'accent-blue-600',
    emerald: 'accent-emerald-600'
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <span className="font-black text-slate-900 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{value.toFixed(1)}{suffix}</span>
      </div>
      <input 
        type="range" 
        min="0" max="100" step="0.5" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer ${colors[color]}`}
      />
    </div>
  );
};

const SocialLink: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <a href="#" className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-600 transition-all">
    {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
  </a>
);

export default App;
