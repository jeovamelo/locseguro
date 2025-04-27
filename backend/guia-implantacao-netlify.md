# Guia de Implantação do LOC Seguro no Netlify

Este guia fornece instruções detalhadas para implantar o sistema LOC Seguro no Netlify, uma plataforma de hospedagem gratuita para sites estáticos.

## Pré-requisitos

- Uma conta no [Netlify](https://www.netlify.com/) (gratuita)
- Git instalado em seu computador (opcional, para método via GitHub)
- Os arquivos do frontend do LOC Seguro

## Método 1: Upload Direto

Este é o método mais simples e rápido para implantar o sistema.

### Passo 1: Preparar os arquivos do frontend

1. Certifique-se de que todos os arquivos do frontend estão organizados corretamente
2. Verifique se o arquivo `netlify.toml` está na raiz do diretório do frontend
3. Certifique-se de que o arquivo `js/api-online.js` está configurado com a URL correta da API

### Passo 2: Criar uma conta no Netlify

1. Acesse [netlify.com](https://www.netlify.com/)
2. Clique em "Sign up" e crie uma conta (pode usar GitHub, GitLab, Bitbucket ou email)
3. Faça login na sua conta

### Passo 3: Implantar o site

1. No dashboard do Netlify, clique em "Add new site" > "Deploy manually"
2. Arraste e solte a pasta `frontend` do LOC Seguro na área indicada
3. Aguarde o upload e a implantação (geralmente leva menos de 1 minuto)
4. Pronto! Seu site estará disponível em um domínio aleatório fornecido pelo Netlify (exemplo: random-name-123456.netlify.app)

## Método 2: Implantação via GitHub

Este método permite atualizações contínuas sempre que você atualizar o código no GitHub.

### Passo 1: Criar um repositório no GitHub

1. Acesse [github.com](https://github.com/) e faça login
2. Crie um novo repositório (pode ser público ou privado)
3. Siga as instruções para fazer upload dos arquivos do frontend do LOC Seguro para o repositório

### Passo 2: Conectar o Netlify ao GitHub

1. No dashboard do Netlify, clique em "Add new site" > "Import an existing project"
2. Escolha GitHub como provedor de Git
3. Autorize o Netlify a acessar seus repositórios GitHub
4. Selecione o repositório que contém os arquivos do frontend do LOC Seguro

### Passo 3: Configurar a implantação

1. Na tela de configuração, defina:
   - Branch to deploy: `main` (ou a branch principal do seu repositório)
   - Base directory: Deixe em branco se os arquivos estiverem na raiz, ou especifique `frontend` se necessário
   - Build command: Deixe em branco (não é necessário para este projeto)
   - Publish directory: Deixe em branco se os arquivos estiverem na raiz, ou especifique `frontend` se necessário

2. Clique em "Deploy site"
3. Aguarde a conclusão da implantação
4. Seu site estará disponível em um domínio aleatório fornecido pelo Netlify

## Configuração de Domínio Personalizado (Opcional)

### Passo 1: Adicionar um domínio personalizado

1. No dashboard do Netlify, selecione seu site
2. Vá para "Site settings" > "Domain management"
3. Clique em "Add custom domain"
4. Digite seu domínio (exemplo: locseguro.com) e clique em "Verify"
5. Siga as instruções para configurar os registros DNS do seu domínio

### Passo 2: Configurar HTTPS

1. Após configurar seu domínio, o Netlify automaticamente fornecerá um certificado SSL gratuito
2. Aguarde alguns minutos para que o certificado seja emitido e ativado
3. Verifique se o HTTPS está funcionando acessando https://seudominio.com

## Configuração de Variáveis de Ambiente (Opcional)

Se você tiver um backend próprio, pode configurar a URL da API como uma variável de ambiente:

1. No dashboard do Netlify, selecione seu site
2. Vá para "Site settings" > "Build & deploy" > "Environment"
3. Clique em "Edit variables"
4. Adicione uma variável chamada `API_URL` com o valor da URL do seu backend
5. Clique em "Save"
6. Reimplante o site para aplicar as alterações

## Solução de Problemas Comuns

### Problema: Página não encontrada (404) ao navegar diretamente para uma rota

**Solução**: Verifique se o arquivo `netlify.toml` está configurado corretamente com as regras de redirecionamento:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Problema: API não está funcionando

**Solução**: 
1. Verifique se a URL da API está correta no arquivo `js/api-online.js`
2. Certifique-se de que o CORS está configurado corretamente no backend
3. Verifique se o backend está online e acessível

### Problema: Imagens ou recursos não estão carregando

**Solução**:
1. Verifique se os caminhos para os recursos estão corretos (use caminhos relativos)
2. Certifique-se de que todos os arquivos foram incluídos no upload
3. Verifique o console do navegador para erros específicos

## Recursos Adicionais

- [Documentação oficial do Netlify](https://docs.netlify.com/)
- [Guia de redirecionamentos do Netlify](https://docs.netlify.com/routing/redirects/)
- [Fórum de suporte do Netlify](https://answers.netlify.com/)

## Suporte

Se você encontrar problemas durante a implantação, consulte a documentação do Netlify ou entre em contato com o suporte do LOC Seguro.
