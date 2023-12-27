function handleCredentialResponse(response) {
   const data = jwt_decode(response.credential);
   if(data.email_verified) {
      localStorage.setItem('metasUser', JSON.stringify(data));
      window.location.href = '/dashboard'
   }
}
window.onload = function () {
   // Inicia as configurações do login
   google.accounts.id.initialize({
      client_id: "102535144641-anjbob4pgiro4ocq6v7ke68j5cghbdrd.apps.googleusercontent.com",
      callback: handleCredentialResponse
   });

   // 
   google.accounts.id.renderButton(
      document.getElementById("buttonDiv"),
      { theme: "outline", size: "large" }  // customization attributes
   );
   google.accounts.id.prompt(); // also display the One Tap dialog

   // Verifica o localStorage para alterar a mensagem de boas vindas
   const metasUserData = localStorage.getItem('metasUser');
   const metasUser = JSON.parse(metasUserData);
   if(!localStorage.getItem('metasUser')) {
      userLogin.textContent = `Bem vindo de volta!`
   } else {
      userLogin.textContent = `Bem vindo de volta ${metasUser.name}`
   }

   checkLoginExpiration();
}

// Função para verificar se o tempo de login expirou
function checkLoginExpiration() {
   const loginTime = localStorage.getItem('loginTime');

   if (loginTime) {
      const currentTime = new Date().getTime();
      const elapsedTime = currentTime - parseInt(loginTime);

      // 24 horas em milissegundos
      const twentyFourHours = 1000;

      if (elapsedTime >= twentyFourHours) {
         // Limpa os dados do usuário e redireciona para a página de login
         localStorage.removeItem('metasUser');
         localStorage.removeItem('loginTime');
         window.location.href = '/';
      }
   }
}