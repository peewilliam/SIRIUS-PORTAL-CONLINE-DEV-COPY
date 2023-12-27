const fs = require('fs');
const xlsx = require('xlsx');

const db = {
    dados: [],
     // Função para ler o arquivo XLSX e retornar um array
    load: async function(workbook){
    // Leitura do arquivo
   

    // Escolhendo a primeira planilha do arquivo (pode ser ajustado conforme sua necessidade)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convertendo os dados para um array de objetos
    const dataArray = xlsx.utils.sheet_to_json(sheet, { header: 'first-row' });

    // Substituindo espaços por underscores, removendo caracteres especiais e ajustando nomes específicos nas chaves dos objetos
    const formattedData = dataArray.map((item) => {
        const formattedItem = {};
        for (const key in item) {
            const newKey = db.formatKey(key);
            formattedItem[newKey] = item[key];
        }
        return formattedItem;
    });

    db.dados = formattedData
    return db.dados;
    },
    get: async function(){
        return db.dados;
    },
    // Função para remover caracteres especiais e ajustar nomes de colunas
    formatKey: function(key){
        // Substituir espaços por underscores
        const formattedKey = key.replace(/\s/g, '_');

        // Remover caracteres especiais, acentos, pontos e hífens
        const normalizedKey = formattedKey.normalize('NFD').replace(/[\u0300-\u036f.,\-]/g, '');

        // Ajustar nomes específicos de colunas
        const adjustedKey = normalizedKey
            .replace('Nº_Tit_Rec', 'Numero_Tit_Rec') // Exemplo: Nº_Tit_Rec -> Numero_Tit_Rec
            .replace('Perc_%_Vendedor', 'Perc_Vendedor') // Exemplo: Perc_%_Vendedor -> Perc_Vendedor
            .replace('CPF/CNPJ_Proprietario', 'CPFCNPJ_Proprietario'); // Exemplo: CPF/CNPJ_Proprietario -> CPFCNPJ_Proprietario

        return adjustedKey;
    }
}



module.exports = {
    db
};