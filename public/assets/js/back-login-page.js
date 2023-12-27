document.querySelector('html').style.display = 'none';

const metasUser = localStorage.getItem('metasUser');
const verification = JSON.parse(metasUser);

if(!metasUser || !verification.email_verified){
   window.location.href = "/";
   } else {
   document.querySelector('html').style.display = 'block';
}