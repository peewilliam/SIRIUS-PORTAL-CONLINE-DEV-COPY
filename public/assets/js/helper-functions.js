const conversao = {
   get_mes:  function(number) {
      const mesAno = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set', 'Out','Nov','Dez']

      return mesAno[number];
   },
}


export default conversao;