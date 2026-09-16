// ============================================
// Ale Motos — Portal Cliente Service (público)
// ============================================

import { prisma } from '../../utils/prisma';

export class PortalClienteService {
  async buscarPorDni(dni: string) {
    const cliente = await prisma.cliente.findUnique({
      where: { dni },
      select: {
        // No exponer datos personales sensibles
        nombre: true,
        motos: {
          select: {
            dominio: true,
            marca: true,
            modelo: true,
            anio: true,
            reparaciones: {
              orderBy: { fechaIngreso: 'desc' },
              select: {
                id: true,
                fechaIngreso: true,
                descripcionProblema: true,
                estado: true,
                totalRepuestos: true,
                totalManoObra: true,
                repuestosUsados: {
                  select: {
                    cantidad: true,
                    precioUnitarioCongelado: true,
                    producto: { select: { nombre: true } },
                  },
                },
                estadoHistorial: {
                  orderBy: { fechaHora: 'asc' },
                  select: {
                    estado: true,
                    fechaHora: true,
                    observaciones: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return cliente;
  }

  async buscarPorDominio(dominio: string) {
    const moto = await prisma.moto.findUnique({
      where: { dominio: dominio.toUpperCase() },
      select: {
        dominio: true,
        marca: true,
        modelo: true,
        anio: true,
        cliente: {
          select: { nombre: true },
        },
        reparaciones: {
          orderBy: { fechaIngreso: 'desc' },
          select: {
            id: true,
            fechaIngreso: true,
            descripcionProblema: true,
            estado: true,
            totalRepuestos: true,
            totalManoObra: true,
            repuestosUsados: {
              select: {
                cantidad: true,
                precioUnitarioCongelado: true,
                producto: { select: { nombre: true } },
              },
            },
            estadoHistorial: {
              orderBy: { fechaHora: 'asc' },
              select: {
                estado: true,
                fechaHora: true,
                observaciones: true,
              },
            },
          },
        },
      },
    });

    return moto;
  }
}

export const portalClienteService = new PortalClienteService();
