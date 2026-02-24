import logo from '@/assets/rpx.svg';

export function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', padding: 16 }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 20px 40px', background: '#fff', borderRadius: 12 }}>
        <img
          src={logo}
          alt="RPX"
          style={{ width: '100%', maxWidth: 220, display: 'block', margin: '0 auto 20px' }}
        />
        <h1>Politica de Privacidade</h1>
        <p>
          Ultima atualizacao: 24 de fevereiro de 2026.
        </p>
        <p>
          Esta Politica de Privacidade descreve como a RPX Cursos coleta, utiliza, armazena e protege os dados pessoais dos usuarios do aplicativo RPX e
          do painel administrativo.
        </p>

        <h2>1. Dados coletados</h2>
        <p>Podemos coletar os seguintes dados:</p>
        <ul>
          <li>Dados cadastrais, como nome, e-mail, senha e perfil de acesso.</li>
          <li>Dados de uso da plataforma, como progresso em cursos, quizzes e interacoes no forum.</li>
          <li>Dados tecnicos, como identificadores de dispositivo, endereco IP e logs de acesso.</li>
          <li>Dados enviados voluntariamente em mensagens para psicologos, respeitando a finalidade educacional e de apoio.</li>
        </ul>

        <h2>2. Finalidades do tratamento</h2>
        <p>Utilizamos os dados para:</p>
        <ul>
          <li>Autenticar usuarios e controlar niveis de permissao.</li>
          <li>Disponibilizar recursos da plataforma e personalizar a experiencia.</li>
          <li>Gerar relatorios academicos, ranking e indicadores de uso.</li>
          <li>Manter seguranca, prevenir fraudes e cumprir obrigacoes legais.</li>
        </ul>

        <h2>3. Compartilhamento de dados</h2>
        <p>
          Nao comercializamos dados pessoais. O compartilhamento pode ocorrer com operadores e fornecedores essenciais para funcionamento do servico
          (infraestrutura, armazenamento e comunicacao), sempre sob obrigacoes de confidencialidade e seguranca.
        </p>

        <h2>4. Armazenamento e seguranca</h2>
        <p>
          Adotamos medidas tecnicas e administrativas para proteger dados contra acessos nao autorizados, perda, alteracao ou divulgacao indevida. Os dados
          sao armazenados pelo tempo necessario para cumprir as finalidades desta politica e obrigacoes legais.
        </p>

        <h2>5. Direitos do titular</h2>
        <p>
          Nos termos da LGPD, voce pode solicitar confirmacao de tratamento, acesso, correcao, anonimizacao, portabilidade e exclusao de dados, quando
          aplicavel.
        </p>

        <h2>6. Criancas e adolescentes</h2>
        <p>
          Quando aplicavel, o tratamento de dados de menores de idade segue as exigencias legais e diretrizes institucionais, com foco no melhor interesse
          do usuario.
        </p>

        <h2>7. Atualizacoes desta politica</h2>
        <p>
          Esta politica pode ser atualizada periodicamente. Recomendamos a consulta regular desta pagina para acompanhar eventuais alteracoes.
        </p>

        <h2>8. Contato</h2>
        <p>
          Para exercicio de direitos ou duvidas sobre privacidade, entre em contato com o administrador responsavel pela plataforma RPX na sua instituicao.
        </p>
      </div>
    </div>
  );
}
