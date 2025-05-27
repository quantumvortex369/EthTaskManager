#!/bin/bash

# Iniciar la red local de Hardhat
npx hardhat node &

# Esperar unos segundos para que la red se inicialice
sleep 5

# Iniciar el frontend
npm run dev
