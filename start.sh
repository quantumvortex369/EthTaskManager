#!/bin/bash

# Instalar dependencias si no están instaladas
if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install
fi

# Iniciar la aplicación
npm run dev
