# README - Sistema LOC Seguro

Este pacote contém o sistema LOC Seguro completo, incluindo o backend e o frontend.

## Estrutura do Pacote

```
locseguro/
├── backend/         # Servidor Node.js com Express e MySQL
│   ├── config/      # Configurações do sistema
│   ├── database/    # Esquema e migrações do banco de dados
│   ├── routes/      # Rotas da API
│   ├── .env.example # Exemplo de configuração de ambiente
│   └── server.js    # Arquivo principal do servidor
│
└── frontend/        # Interface de usuário
    ├── css/         # Estilos CSS
    ├── js/          # Scripts JavaScript
    ├── img/         # Imagens e recursos
    └── *.html       # Páginas HTML
```

## Requisitos do Sistema

- Node.js 14.x ou superior
- MySQL 5.7 ou superior
- Navegador web moderno (Chrome, Firefox, Edge, Safari)

## Instruções de Instalação

Siga as instruções detalhadas no arquivo `guia-implantacao-ubuntu-vm.md` para implantar o sistema em uma máquina virtual Ubuntu.

## Configuração Rápida

1. **Backend**:
   - Navegue até a pasta `backend`
   - Copie `.env.example` para `.env` e ajuste as configurações
   - Execute `npm install` para instalar dependências
   - Execute `node server.js` para iniciar o servidor

2. **Frontend**:
   - Navegue até a pasta `frontend`
   - Abra `index.html` em um navegador ou use um servidor HTTP

## Suporte

Se encontrar problemas durante a instalação ou uso do sistema, consulte a documentação ou entre em contato com o suporte.

---

LOC Seguro - Sistema de Locação de Carros com Avaliação e Multa
