# unip-scheduler
# SGSEI - Sistema de Gerenciamento de Salas, Equipamentos e Insumos

Este projeto é um sistema web desenvolvido para facilitar o gerenciamento de recursos físicos e tecnológicos da UNIP Tefé, como salas, equipamentos e insumos. O SGSEI visa otimizar o controle, o agendamento e a manutenção de recursos, promovendo maior organização e eficiência nos processos institucionais.

## ✨ Funcionalidades

- Cadastro e gerenciamento de **salas** (nome, capacidade, localização).
- Controle de **equipamentos** (inventário, estado de uso, histórico).
- Gestão de **insumos** (quantidade, tipo, uso).
- Sistema de **agendamentos** e reservas com controle de conflitos.
- Painel administrativo com **controle de usuários** e permissões.
- Autenticação via **Supabase**.
- Interface moderna com **Next.js + TailwindCSS** e componentes Radix UI.

## 🚀 Tecnologias Utilizadas

- [Next.js](https://nextjs.org/) – Framework React para produção.
- [React](https://react.dev/)
- [Supabase](https://supabase.com/) – Backend como serviço (autenticação e banco de dados).
- [Tailwind CSS](https://tailwindcss.com/) – Estilização com classes utilitárias.
- [Radix UI](https://www.radix-ui.com/) – Componentes acessíveis e estiláveis.
- [Zod](https://zod.dev/) – Validação de esquemas.
- [React Hook Form](https://react-hook-form.com/) – Manipulação de formulários.
- [Recharts](https://recharts.org/) – Visualização de dados.

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/sgsei.git

# Acesse a pasta do projeto
cd sgsei

# Instale as dependências
npm install
```

## 💻 Uso

Para rodar localmente em ambiente de desenvolvimento:

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 🔐 Configuração do Supabase

Crie um projeto no [Supabase](https://supabase.com/) e adicione as variáveis de ambiente no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<sua-url>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua-chave-anon>
```

## 📁 Estrutura do Projeto

```
├── components/         # Componentes reutilizáveis
├── pages/              # Rotas do Next.js
├── lib/                # Funções auxiliares e configs (ex: Supabase client)
├── styles/             # Estilos globais
├── public/             # Arquivos estáticos
├── app/                # Estrutura do Next 13+
└── ...
```

## 🧑‍🏫 Desenvolvido por

Projeto desenvolvido por **Felipe Hüffner** e equipe da UNIP Tefé para uso institucional interno.

## 📝 Licença

Este projeto é de uso interno e educacional. Todos os direitos reservados à UNIP Tefé.

---

> Para dúvidas ou contribuições, entre em contato pelo e-mail institucional ou pelo GitHub.
