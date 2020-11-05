# Instalação #

Assegure que o git e o curl estejam instalados no sistema:

* se o seu sistema usar apt:
  ```bash
  sudo apt install git curl
  ```

* se o seu sistema usar yum:
  ```bash
  sudo yum install git curl
  ```

depois disso, baixe o repositório com o comando:
```bash
git clone https://github.com/arthurferrai/test-chat-js.git
```

instale o nvm:
```bash
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.35.3/install.sh | bash
```

deslogue e logue novamente (ou feche e abra o terminal)

instale a última versão do pacote nodejs:
```bash
nvm install 14.15.0
```

marque esta versão como padrão:
```bash
nvm use 14.15.0
nvm alias default 14.15.0
```

instale o pacote pm2 usando o npm:
```bash
npm install pm2@latest -g
```

entre na pasta do aplicativo e instale as bibliotecas necessárias:
```bash
cd test-chat-js
npm install
```

inicie o aplicativo com o comando:
```bash
pm2 start src/index.js
```

Para o aplicativo iniciar automaticamente no início do sistema, rode o comando:
```bash
pm2 startup
```
A saída deste comando dirá qual o próximo comando que deve ser executado.

Após rodar o comando exibido na tela, salve a configuração rodando o seguinte comando:
```bash
pm2 save
```

Para ver os logs do aplicativo, rode o seguinte comando:
```bash
pm2 logs
```

Para reiniciar o aplicativo, rode o seguinte comando:
```bash
pm2 restart 0
```

Quando o mesmo estiver rodando corretamente, poderá ser acessado utilizando a porta 8443

Este aplicativo necessita que o servidor contenha a chave privada e o certificado digital presentes para o correto funcionamento.
No momento, o aplicativo está configurado para pegar as chaves nos respectivos caminhos:
* **Chave Privada**: `/home/andrekamargo/afinalds.com.br.key`
* **Certificado**: `/home/andrekamargo/server.crt`

Caso os arquivos não se encontrem nesses caminhos, edite o arquivo `src/index.js` e altere as localizações do mesmo:
* **Chave Privada**: linha 11
* **Certificado**: linha 12
