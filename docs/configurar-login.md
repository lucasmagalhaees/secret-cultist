# Configurar o login (D138) — pendente

O Lucas vai fazer quando tiver tempo; é só pedir "o que preciso fazer para habilitar a autenticação" que a lista é esta.

1. **GitHub, secret-cultist → Settings → Secrets → Actions:** secret `DLC_KEY` com a chave da expansão (a que foi passada na conversa de 2026-11-09; guarde-a num gerenciador de senhas: sem ela a expansão cifrada não abre mais e precisa ser cifrada de novo).
2. **Supabase, projeto lore-enhancer → SQL Editor:** rodar `sql/auth.sql`, depois o `insert` comentado no fim, com a chave no lugar de `KEY_AQUI`.
3. **Supabase → Authentication → Users → Add user** ("Auto Confirm User"): o e-mail do Lucas; depois o `update` do fim do `auth.sql` para o papel `driver`.
4. **Vercel → Settings → Environment Variables:** `VITE_SUPABASE_PUBLISHABLE_KEY` com a chave `sb_publishable_…`; depois Redeploy.

Planejado (2026-11-09): a rota pública `/` abre direto o Secret Leônidas, sem login; o login leva ao `/painel` do driver, com o Secret Cultist e a expansão histórica. A conta de visitante (pedestrian) deixa de ser necessária.
