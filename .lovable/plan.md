# Plano — Animal Controller 3D

## Objetivo
Transformar o protótipo enviado em um painel demonstrável, com aparência de produto real, totalmente front-end e centrado em um cão ou gato 3D cujo corpo, movimento e ambiente comuniquem o humor sem depender de texto.

## Experiência principal
- Criar um painel em tela cheia com navegação lateral compacta, identificação do pet, área central 3D e controles de observação.
- Permitir alternar entre **cão** e **gato**, informar tutor, nome e idade e selecionar comportamentos observados.
- Preservar a lógica do protótipo: grupos de comportamentos, pesos, quatro faixas de humor e alertas de sinais importantes.
- Calcular tudo no navegador, sem login, banco de dados ou integrações externas nesta etapa.
- Incluir dados demonstrativos locais para histórico recente, resumo diário e indicadores, deixando claro visualmente que o sistema já possui profundidade de produto.

## Cena 3D e leitura visual do humor
- Usar modelos 3D licenciados para uso livre, compactos e preparados para web, um cão e um gato.
- Criar quatro estados visuais com transições suaves:
  - **Feliz:** postura aberta, cauda ativa, movimentos leves, ambiente vivo e partículas ascendentes.
  - **Neutro:** respiração calma, postura equilibrada e iluminação estável.
  - **Estressado:** corpo retraído, orelhas baixas, movimentos curtos, ambiente tenso e pulsação visual.
  - **Muito alterado:** postura defensiva, agitação mais intensa, luz de alerta e distorção sutil no ambiente.
- Alterar simultaneamente animação corporal, velocidade, postura, iluminação, cores, partículas e shader de fundo para o humor ser reconhecido antes de qualquer rótulo.
- Permitir rotação controlada do animal e resposta sutil ao ponteiro, sem transformar a interface em jogo.

## Interface e direção visual
- Adotar estética de centro veterinário tecnológico: superfícies claras e grafite, verde clínico, coral de atenção e amarelo de observação, evitando o visual genérico de painel azul.
- Dar prioridade ao animal 3D no centro, com informações densas porém organizadas ao redor, sem cartões dentro de cartões.
- Usar ícones, chips de comportamento, medidores, mini gráficos em Canvas/SVG e microanimações para reforçar o efeito “UAU”.
- Garantir boa apresentação em desktop e adaptação para celular, com controles acessíveis, foco visível e respeito à preferência de movimento reduzido.

## Estrutura funcional
1. **Visão geral:** pet ativo, condição atual, cena 3D e resumo dos sinais.
2. **Nova avaliação:** seleção por grupos — positivo, atenção, estresse, agressividade e sinais específicos de cão/gato.
3. **Resultado imediato:** transição da cena para o humor calculado, medidor e orientação correspondente.
4. **Histórico demonstrativo:** linha temporal e tendência com dados locais fictícios, sem persistência real.
5. **Troca de pet:** alternância entre os perfis demonstrativos de cão e gato.

## Detalhes técnicos
- Manter a base React 19 + TanStack Start e substituir a página provisória em `/`.
- Usar Three.js r160 por pacote, integrado com React Three Fiber/Drei; a cena será carregada apenas no navegador para evitar conflitos com renderização inicial.
- Usar WebGL/GLSL para ambiente, partículas e transições; Canvas 2D/SVG para gráficos e indicadores auxiliares.
- Definir cores, sombras e demais estilos como tokens semânticos no tema global.
- Separar cena, modelos, estados de humor, painel e dados simulados em módulos focados.
- Atualizar os metadados da página para Animal Controller e manter uma apresentação útil mesmo durante o carregamento dos modelos.

## Validação
- Verificar os quatro humores para cão e gato e confirmar que cada um é visualmente distinguível sem ler o resultado.
- Testar seleção de comportamentos, recálculo, troca de espécie, rotação da cena e histórico demonstrativo.
- Validar desktop e celular, ausência de tela preta, carregamento dos modelos, contraste, sobreposições e erros de console.
- Manter os testes existentes e conferir o resultado final diretamente no navegador.

## Fora desta etapa
- Banco de dados, cadastro/login, histórico persistente, integração veterinária, sensores e APIs reais.
