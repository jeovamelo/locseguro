// Configuração para integrar o frontend com o backend real
// Este arquivo deve ser incluído após api.js e demo-mode.js

// Configurar a URL da API baseada no ambiente
const configureApiUrl = () => {
  // Verificar se estamos em ambiente de produção
  if (window.location.hostname.includes('locseguro.manus.space') || 
      window.location.hostname.includes('xdmhkykh.manus.space')) {
    // URL de produção
    return 'https://api-locseguro.herokuapp.com/api';
  } else if (window.location.hostname.includes('localhost') || 
             window.location.hostname.includes('127.0.0.1')) {
    // URL de desenvolvimento local
    return 'http://localhost:3000/api';
  } else {
    // URL de teste/staging
    return 'https://api-locseguro-staging.herokuapp.com/api';
  }
};

// Sobrescrever a URL da API no objeto window.api
document.addEventListener('DOMContentLoaded', () => {
  // Importar o arquivo api-online.js dinamicamente
  const script = document.createElement('script');
  script.src = '/js/api-online.js';
  script.onload = () => {
    console.log('API online carregada com sucesso');
    
    // Configurar a URL da API
    window.API_URL = configureApiUrl();
    console.log('API URL configurada:', window.API_URL);
    
    // Inicializar a API
    window.api.inicializar().then(online => {
      console.log('Sistema inicializado no modo:', online ? 'online' : 'demonstração');
      
      // Adicionar indicador de modo
      const modeIndicator = document.createElement('div');
      modeIndicator.id = 'mode-indicator';
      modeIndicator.className = online ? 'online-mode' : 'demo-mode';
      modeIndicator.textContent = online ? 'MODO ONLINE' : 'MODO DEMONSTRAÇÃO';
      document.body.appendChild(modeIndicator);
    });
  };
  
  document.head.appendChild(script);
});
