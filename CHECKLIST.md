# Checklist final — Nexus Web

Consolidado depois de reconstruir o frontend módulo a módulo (Fundação → Design
System → Autenticação → Dashboard → Tarefas → Estudos → Questões → Caderno de Erros
→ Revisões → Treinos → Financeiro → IA → Perfil → Responsividade → Acessibilidade →
Performance → Preparação para produção).

## O que foi verificado automaticamente, em toda etapa

- [x] `tsc -b` sem erros, em todos os 18 módulos.
- [x] `vite build` (build de produção) sem erros, em todos os 18 módulos.
- [x] Nenhum endpoint, campo ou resposta de API inventados — todo contrato foi
      conferido contra o código-fonte real do backend antes de implementar.

## O que ainda depende de teste manual seu (não tenho browser real neste ambiente)

- [ ] Testar em desktop (Chrome/Firefox) — fluxo completo: login → Hoje → cada módulo.
- [ ] Testar em mobile real ou devtools em modo responsivo (~375-390px) — a bottom
      nav, os formulários empilhados e os diálogos.
- [ ] Sem erros no console do navegador durante o uso normal.
- [ ] Login, cadastro, logout e expiração de sessão (edite `nexus.token` no
      `localStorage` pra forçar um 401 e confirmar o logout automático).

## Funcionalidades que faltavam e foram completadas depois

- **Simulados** (`/estudos/simulados`) e **Desempenho** (`/estudos/desempenho`)
  saíram do estado de placeholder e foram implementados por completo:
  configuração → iniciar → execução com cronômetro/navegação/marcar questão →
  finalizar → resultado com análise por matéria, e as 4 visões de estatística
  (geral, por matéria, por assunto, por período). Ver `README.md` → "Notas de
  implementação — Simulados" para a decisão de travar a resposta depois de
  escolhida (evita inflar o placar, dado como o backend conta respostas).

## Lacunas de backend (nenhuma contornada com gambiarra no frontend)

| Área | Falta no backend | Efeito no frontend |
|---|---|---|
| Tarefas | `PUT`/`DELETE /api/tasks/{id}` | Não dá para editar ou excluir uma tarefa |
| Treinos | `PUT`/`DELETE /api/workouts/{id}` | Não dá para editar ou excluir um treino |
| Perfil | `GET/PUT /api/users/me`, controller de `Profile`/`Preferences` | Tela mostra só o que já está na sessão (e-mail, id) |
| Financeiro | Controller de `Category`/`CategoryType`/`FinancialGoal` | Sem categorias nem metas financeiras |
| Caderno de Erros | `StudyErrorResponse` sem matéria/assunto/dificuldade | Filtros limitados a status e período |
| Login | Endpoint de recuperação de senha | Tela "Esqueci minha senha" é só um aviso |

## Preparação para produção

- [x] `.env.example` criado, documentando `VITE_API_URL`.
- [x] `README.md` reescrito e atualizado (CORS, autenticação, todas as rotas, lacunas conhecidas).
- [x] Error Boundary global (`src/components/ErrorBoundary.tsx`) — erro de render em
      qualquer tela mostra um fallback com botão de recarregar, em vez de tela branca.
- [x] Code splitting por rota + `staleTime` de 30s no React Query (Performance).
- [ ] Variáveis de ambiente de produção (URL da API real) — depende de onde a API vai
      ser hospedada, não dá pra prever aqui.
