# Equipe — gestão de funcionários

Aplicação web responsiva para cadastrar, consultar, editar e excluir funcionários. A tela e a API são servidas pelo mesmo processo Node.js; os dados são armazenados no MySQL.

## Início rápido com Docker

Requisitos: Docker Engine e Docker Compose v2.

1. Copie `.env.example` para `.env` e defina senhas fortes para `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`.
2. Inicie a aplicação:

   ```sh
   docker compose up --build -d
   ```

3. Acesse <http://localhost:3000>. A API fica em `/api/funcionarios`; a verificação de saúde fica em `/api/health`.

O banco e as tabelas são inicializados automaticamente na primeira execução. O volume `mysql-data` mantém os dados entre reinicializações. O SQL de inicialização só é executado quando o diretório de dados do MySQL está vazio.

Comandos úteis:

```sh
docker compose ps
docker compose logs -f app
docker compose down
```

`docker compose down` preserva o banco. Para apagar os dados junto com os containers, use `docker compose down -v`.

## Desenvolvimento local

Requisitos: Node.js 22+ e MySQL 8.4. Configure um banco e a tabela usando `database/init.sql`, depois exporte as variáveis `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER` e `DB_PASSWORD` no terminal.

```sh
npm ci
npm run dev
```

Por padrão, a aplicação inicia na porta 3000. Em desenvolvimento, `DB_HOST` assume `localhost` e o usuário assume `root`.

## API

| Método | Endpoint | Ação |
| --- | --- | --- |
| `GET` | `/api/funcionarios` | Lista os funcionários, dos mais recentes aos mais antigos |
| `POST` | `/api/funcionarios` | Cria um funcionário |
| `PUT` | `/api/funcionarios/:id` | Atualiza nome, função e salário |
| `DELETE` | `/api/funcionarios/:id` | Exclui um funcionário |
| `GET` | `/api/health` | Verifica servidor e conexão com MySQL |

Exemplo de corpo para criar ou atualizar:

```json
{
  "nome": "Ana Souza",
  "funcao": "Analista de operações",
  "salario": "4250.00"
}
```

Nome e função são obrigatórios e limitados a 100 caracteres. Salários positivos aceitam até duas casas decimais e o intervalo suportado é até R$ 99.999.999,99. A API retorna erros de validação com status `400` e registros inexistentes com status `404`.

## CI/CD no GitHub

O workflow `CI e publicação Docker` verifica a sintaxe e executa os testes com Node.js 22 em pull requests. Em pushes para `main` e tags `v*`, também constrói e publica a imagem no GitHub Container Registry (GHCR), marcada com `latest`, a tag da versão e o SHA do commit. Ative a permissão de escrita de pacotes nas configurações do repositório, se necessário.

O workflow `Implantação manual` atualiza um servidor Linux com Docker Compose quando acionado em **Actions → Implantação manual → Run workflow**. O repositório precisa configurar estes secrets e habilitar o ambiente `production`:

- `DEPLOY_HOST`: endereço do servidor.
- `DEPLOY_USER`: usuário SSH que pode executar Docker Compose.
- `DEPLOY_SSH_KEY`: chave privada SSH para esse usuário.
- `DEPLOY_PATH`: diretório no servidor que contém `compose.yaml` e um `.env` com `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`.

O diretório de implantação no servidor deve conter `compose.yaml` e `database/init.sql`. A imagem no GHCR deve estar acessível ao servidor. O token usado durante a implantação é o token temporário do GitHub Actions; para baixar imagens privadas depois que o job terminar, configure no servidor um token de leitura do GHCR ou publique o pacote como público.

## Verificações locais

```sh
npm run check
npm test
```
