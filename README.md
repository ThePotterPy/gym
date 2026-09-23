# Emporio Gym & Fitness

Plataforma de entrenamiento para socios de Emporio Gym. Permite consultar la programación diaria, crear rutinas, registrar series y cargas, revisar el historial y asignar rutinas desde el panel del entrenador.

## Requisitos

- Node.js 20 o superior
- npm

## Configuración local

1. Copiá `.env.example` como `.env`.
2. Configurá una contraseña administrativa larga y un `SESSION_SECRET` aleatorio de al menos 32 caracteres.
3. Instalá dependencias con `npm install`.
4. Sincronizá la base con `npm run db:push`.
5. Para cargar datos de demostración, ejecutá `npm run db:seed`.
6. Iniciá el proyecto con `npm run dev`.

La aplicación queda disponible en `http://localhost:3000` y el panel del entrenador en `/gestion-admin`.

## Verificación

```bash
npm run typecheck
npm run build
```

`npm run check` ejecuta ambas verificaciones.

## Seguridad

- Las cookies de socio y administrador están firmadas, son `httpOnly` y `sameSite=strict`.
- Las operaciones de entrenamiento verifican que la sesión pertenezca al socio autenticado.
- La edición global de ejercicios y la asignación de rutinas requieren sesión administrativa.
- No uses las credenciales de ejemplo ni SQLite como almacenamiento compartido en un despliegue distribuido.

El acceso rápido de socios sigue siendo por nombre para conservar el flujo de recepción del gimnasio. Si la aplicación se expone públicamente o almacena información sensible, el siguiente paso recomendado es agregar un PIN individual o autenticación mediante número de socio/QR.
