# 🤖 NEXUS B1NÁR10 

![Badge HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![Badge CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Badge JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Badge Status](https://img.shields.io/badge/Status-Concluído-success?style=for-the-badge)

**Nexus B1nár10** é um Web App gamificado desenvolvido com o intuito de facilitar e tornar divertido o aprendizado de **Arquitetura de Computadores** e **Conversão de Bases Numéricas** (Binário, Octal, Hexadecimal e Decimal).

O projeto foi construído inteiramente em **Vanilla JS, CSS3 puro e HTML5** dentro de um único arquivo, focando em altíssima performance, responsividade (Mobile-First) e ferramentas robustas de acessibilidade.

---

## ✨ Funcionalidades Principais

*   **🎮 Múltiplos Modos de Jogo:**
    *   **Números Sortidos:** Converta números aleatórios gerados proceduralmente de acordo com a base escolhida.
    *   **Quiz Teórico:** Teste seus conhecimentos teóricos baseados nos conceitos de Arquitetura de Computadores.
    *   **Torre de Desafios (Blind Mode):** Modo "Time Attack" onde o HUD é ocultado e a adrenalina sobe. O jogador corre contra o tempo selecionado sem saber se está acertando ou sua pontuação até o fim do jogo.
*   **🧠 Calculadora "Varal" Inteligente:** Uma ferramenta *in-game* (Bloco de Notas) interativa que se adapta à base escolhida (Trabalhando com o truque dos 3-bits para Octal e 4-bits para Hexadecimal) clicando nos slots para somar valores instantaneamente sem precisar de rascunhos de papel.
*   **💡 Sistema de Dicas Progressivas (Risco vs. Recompensa):** Os jogadores podem pedir dicas. As primeiras são gratuitas, mas as seguintes custam tempo (na Torre) ou Vidas (❤️), dando pequenas frações da resposta ou ensinando conceitos on-the-fly.
*   **📚 Central de Estudos Integrada:** Aulas completas e diretas ao ponto integradas dentro do aplicativo, ensinando métodos rápidos (como o Método das Caixinhas e Truques de Bits) para conversões.
*   **📸 Exportação de Score:** Um motor que desenha os status finais do jogador através da `Canvas API` e gera um cartão em `.png` para download automático no Game Over.
*   **🎵 Motor de Áudio Procedural:** Sons e músicas gerados nativamente pelo navegador utilizando a **Web Audio API**. Zero dependências de arquivos de áudio externos (`.mp3` ou `.wav`), garantindo um carregamento instantâneo.

---

## 👁️ Foco em Acessibilidade (A11Y)

A UI/UX do sistema foi cuidadosamente pensada para abranger o máximo de usuários possível, contando com um menu de configurações dedicado:

*   **Fonte para Dislexia:** Troca instantânea da tipografia estilizada por fontes de alta legibilidade (sans-serif) com espaçamento otimizado para usuários disléxicos.
*   **Alto Contraste:** Inversão de gradientes para fundos escuros e sólidos, protegendo a visão em ambientes de baixa luminosidade.
*   **Redução de Movimento:** Desativação de todas as animações (flutuação do mascote, fundos dinâmicos e tremores) para evitar fadiga visual ou gatilhos de labirintite.
*   **Escala de Fonte Global:** Botões que escalam a interface inteira via unidades relativas (`rem`), permitindo aumentar ou diminuir a leitura em todos os cantos do site.

---

## 🎨 Sistema de Temas Dinâmico

O jogo altera estruturalmente o CSS via atributos `data-theme`. A mudança não altera apenas cores, mas também **formatos de botões, sombras, transições e efeitos de fundo**. 

**Temas Inclusos:**
*   **Games:** Sonic, Arcade 8-Bit.
*   **Cultura Pop/Geek:** Matrix, Sakura (Anime), Star Wars (CSS Radial Gradient Starfield), Retrô 80s (Vaporwave).
*   **Customizável:** O usuário pode montar seu próprio gradiente de 4 cores via `Color Picker`.

---

## 🚀 Como Executar o Projeto

Sendo um projeto "Zero Dependências" (Vanilla), rodar o Nexus B1nár10 é absurdamente simples:

1. Faça o clone deste repositório:
   ```bash
   git clone [https://github.com/SEU_USUARIO/nexus-binario.git](https://github.com/SEU_USUARIO/nexus-binario.git)
