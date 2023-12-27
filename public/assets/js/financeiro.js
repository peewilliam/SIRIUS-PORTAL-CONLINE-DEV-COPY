import conversao from "./helper-functions.js";

(async function() {
      console.log(conversao.get_mes(0));
      const fluxo_ano_anterior = await Thefetch('/api/ano-anterior')

   
      console.log(fluxo_ano_anterior)
})();