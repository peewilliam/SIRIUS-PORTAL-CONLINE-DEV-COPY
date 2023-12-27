const {executeQuery} = require('../connect/mysql');
const {headCargoQuery} = require('../connect/headCargo');
const fs = require('fs');


const commission = {
    dados: [],
    getValuesCommisionsByUser: async function(id){
        const commissions = await executeQuery(`SELECT DISTINCT commission_percentage.*,collaborators.id_headcargo  FROM commission_percentage
        JOIN collaborators ON collaborators.id = id_collaborators WHERE id_headcargo = ${id}`)


        return commissions
    },
    listUser: async function(){
        const ListUsersHeadcago = await headCargoQuery(`SELECT * FROM vis_Vendedor_InsideSales`)
        

        const commissions = await executeQuery(`SELECT DISTINCT commission_percentage.*,collaborators.id_headcargo  FROM commission_percentage
        JOIN collaborators ON collaborators.id = id_collaborators`)

 

        let Comissionados = commissions.map(item => item.id_headcargo);

        let itensIguais = ListUsersHeadcago.filter(item => Comissionados.includes(item.IdPessoa));

        const novoArray = itensIguais.filter((item, index, array) => {
            // Retorna true se o índice do item atual for igual ao índice do primeiro item com o mesmo IdPessoa
            return array.findIndex(i => i.IdPessoa === item.IdPessoa) === index;
          });

      
        return novoArray;
    },
    getByUser: async function(id) {
        const where = `WHERE c.ID_INSIDE_SALES = ${id} AND (c.SITUACAO_AGENCIAMENTO = 'AUDITADO')
            UNION ALL
            SELECT * FROM vis_Comissao_vendedor_atualizada
            WHERE ID_VENDEDOR = ${id} AND SITUACAO_AGENCIAMENTO = 'AUDITADO';`;

        let result = await headCargoQuery(`
            SELECT * FROM vis_Comissao_vendedor_atualizada AS c
            ${where} 
        `);

        const commissions = await executeQuery(`SELECT commission_percentage.*,collaborators.id_headcargo  FROM commission_percentage
        JOIN collaborators ON collaborators.id = id_collaborators`)


        const lastComission = await executeQuery(`SELECT * FROM commission_history WHERE id_seller = ${id} OR id_inside = ${id}`)


        for (let index = 0; index < result.length; index++) {
            const element = result[index];

            commissions.find(objeto => objeto.id_headcargo == id && objeto.type == 1);


            if((element.ID_VENDEDOR == id && element.ID_INSIDE_SALES != id)){
                const comissao = commissions.find(objeto => objeto.id_headcargo == id && objeto.type == 1);
                element.percentage = comissao && comissao.percentage ? Number(comissao.percentage) : 'Não definida'
            }else if (element.ID_VENDEDOR != id && element.ID_INSIDE_SALES == id){
                const comissao = commissions.find(objeto => objeto.id_headcargo == id && objeto.type == 2);
                element.percentage = comissao && comissao.percentage ? Number(comissao.percentage) : 'Não definida'
            }else if(element.ID_VENDEDOR == id && element.ID_INSIDE_SALES == id){
                const comissao = commissions.filter(objeto => objeto.id_headcargo == id);
                const countComissao = comissao.reduce((total, comissao) => total + comissao.percentage, 0);
            
                element.percentage = Number(countComissao)
            }



            element.commission = typeof element.percentage === 'number' ? (element.percentage / 100) * element.VALOR_EFETIVO_TOTAL : 0
            
            
        }

        // Extrair todos os 'id_process' do array 'commissions'
        const idProcessCommissions = lastComission.map(comissao => comissao.id_process);


        // Filtrar o array 'result' para manter apenas os objetos cujo 'IdLogistica_House' não está presente em 'idProcessCommissions'
        result = result.filter(element => !idProcessCommissions.includes(element.IdLogistica_House));

    
        return result;
    },
    RegisterCommission: async function (body) {
        const reference = await this.criarReferencia();
        const comission = await executeQuery(`INSERT INTO commission_reference (reference, date, user) VALUES ('${reference}', NOW(), ${body[0].userComission})`);
        const idComission = comission.insertId;

        // Criar uma nova instância do objeto Date para representar a data e hora atual
        const dataAtual = new Date();
        // Ajustar o fuso horário para -3 horas
        dataAtual.setHours(dataAtual.getHours() - 3);
        // Obter uma string no formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ)
        const dataFormatada = dataAtual.toISOString().slice(0, 19).replace('T', ' ');
        
        for (let index = 0; index < body.length; index++) {
            const element = body[index];
            let audited_date = new Date(element.audited);
            audited_date = audited_date.toISOString().slice(0, 19).replace('T', ' ');
            await executeQuery(`INSERT INTO commission_history (reference, id_process,reference_process, modal, id_seller, id_inside, effective, percentage, commission, create_date, audited) 
            VALUES (${idComission}, ${element.idProcess},'${element.reference_process}', '${element.modal}', ${element.id_seller}, ${element.id_inside}, '${element.effective}', ${element.percentage}, '${element.commission}', '${dataFormatada}', '${audited_date}')`);
        }


        return true
    
    },
    criarReferencia: async function () {
        // Obtém a última referência criada
        const lastReferenceResult = await executeQuery('SELECT * FROM commission_reference ORDER BY id DESC LIMIT 1');
        const lastReference = lastReferenceResult.length > 0 ? lastReferenceResult[0].reference : null;
    
        // Extrai a quantidade formatada da última referência
        const quantidadeFormatada = lastReference ? lastReference.split('CMS')[1].split('-')[0] : '0000';
    
        const anoAtual = new Date().getFullYear();
        // Obtém os dois últimos dígitos do ano atual
        const doisUltimosDigitosAno = String(anoAtual).slice(-2);
    
        // Incrementa a quantidade formatada para a próxima referência
        const proximaQuantidadeFormatada = String(Number(quantidadeFormatada) + 1).padStart(4, '0');
    
        // Combina os elementos para formar a referência
        const referencia = `CMS${proximaQuantidadeFormatada}-${doisUltimosDigitosAno}`;
    
        return referencia;
    },
    ComissionHistory: async function(){
        let comission = await executeQuery(`SELECT 
        cr.id AS commission_reference_id,
        COUNT(cr.id) as quantidade,
        MAX(cr.date) AS date,
        MAX(cr.user) AS idHeadCargoUser,
        MAX(c.name) AS userComission_name,
        MAX(c.id) AS idUser,
        SUM(ch.commission) AS total_commission_value
    FROM 
        commission_reference cr
    JOIN 
        commission_history ch ON cr.id = ch.reference
    JOIN 
        collaborators c ON cr.user = c.id_headcargo
    GROUP BY 
        cr.id
    ORDER BY 
        commission_reference_id desc`);


        comission = comission.map(element => {
            return {
                ...element,
                total_commission_value: commission.formatCurrency(element.total_commission_value),
                date: commission.formatDateBR(element.date)
            };
        });

        return comission

    },
    ContentComissionHistory: async function(id){

        let result = await executeQuery(`SELECT 
        colab_inside.name AS inside_name,
        colab_inside.family_name AS inside_family_name,
        colab_seller.name AS seller_name,
        colab_seller.family_name AS seller_family_name,
		colab_commission.name AS comission_name,
        colab_commission.family_name AS comission_family_name,
        comm_ref.user as user_comission,
        comm_ref.status as status_comission,
        comm_ref.date as create_comission,
        comm_ref.approved_date as approved_date,
        comm_ref.declined_date as declined_date,
        comm_ref.payment_date as payment_date,
        comm_ref.reference as reference,
        commission_history.reference as reference_id,
		commission_history.status as status_process,
		commission_history.date_status as date_status,
        commission_history.audited as audited,
        commission_history.id as id_history,
        commission_history.reference_process as reference_process,
        commission_history.id_process,
        commission_history.id_seller,
        commission_history.id_inside,
        commission_history.effective,
        commission_history.percentage,
        commission_history.commission,
        commission_history.modal
      FROM commission_history
      LEFT JOIN collaborators colab_inside ON colab_inside.id_headcargo = commission_history.id_inside
      LEFT JOIN collaborators colab_seller ON colab_seller.id_headcargo = commission_history.id_seller
      LEFT JOIN commission_reference comm_ref ON comm_ref.id = commission_history.reference
      LEFT JOIN collaborators colab_commission ON colab_commission.id_headcargo = comm_ref.user
      WHERE commission_history.reference = ${id}`)


        
        // TEMP REFATORAR
        let nameComission, table, valueComission;

        table = result.map(element => {
            
            return {
                ...element,
                audited: commission.formatDateBRUTC(element.audited),
                create_comission: commission.formatDateBR(element.create_comission),
                commission: commission.formatCurrency(Number(element.commission)),
                effective: commission.formatCurrency(Number(element.effective))
            };
        });
        // console.log(table)



        valueComission = await this.SumValuesComissions(result,'commission');
        nameComission = await this.formatarNomeCompleto(`${result[0].comission_name} ${result[0].comission_family_name}`) 
        const format = {
            user_comission:result[0].user_comission,
            nameComission: nameComission,
            valueComission: valueComission,
            status_comission: result[0].status_comission,
            approved_date:result[0].approved_date != '' && result[0].approved_date != null ? commission.formatDateBR(result[0].approved_date) : '',
            declined_date:result[0].declined_date != '' && result[0].declined_date != null ? commission.formatDateBR(result[0].declined_date) : '',
            payment_date:result[0].payment_date != '' && result[0].payment_date != null ? commission.formatDateBR(result[0].payment_date) : '',
            dateComission: commission.formatDateBR(result[0].create_comission),
            table:table,

        }



        return format;
        
    },
    SumValuesComissions: async function(array, colunm){
        let total = 0 
        for (let index = 0; index < array.length; index++) {
            const element = array[index];

            total += Number(element[colunm]);

        }

        return this.formatCurrency(total);
    },
    formatCurrency: function(value) {
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    },
    formatDateBRUTC: function (dataOriginal){
        // Criar um objeto de data
        const data = new Date(dataOriginal);
    
        // Extrair o dia, mês e ano em formato UTC
        const dia = data.getUTCDate().toString().padStart(2, "0");
        const mes = (data.getUTCMonth() + 1).toString().padStart(2, "0");
        const ano = data.getUTCFullYear();
        // Extrair a hora e os minutos em formato UTC
        const hora = data.getUTCHours().toString().padStart(2, "0");
        const minutos = data.getUTCMinutes().toString().padStart(2, "0");


        // Criar a string formatada
        return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
    },
    formatDateBR: function (dataOriginal){
    // Criar um objeto de data
    const data = new Date(dataOriginal);

    // Ajustar o fuso horário para -3 horas
    data.setHours(data.getHours() - 3);

    // Extrair o dia, mês e ano em formato local
    const dia = data.getDate().toString().padStart(2, "0");
    const mes = (data.getMonth() + 1).toString().padStart(2, "0");
    const ano = data.getFullYear();
    
    // Extrair a hora e os minutos em formato local
    const hora = data.getHours().toString().padStart(2, "0");
    const minutos = data.getMinutes().toString().padStart(2, "0");

    // Criar a string formatada
    return `${dia}/${mes}/${ano} ${hora}:${minutos}`;
    },
    formatarNomeCompleto: async function (nomeCompleto) {
        if(nomeCompleto != null){
        // Lista de prefixos que devem permanecer em minúsculas
        const prefixos = ["de", "da", "do", "dos", "das"];
    
        // Divida o nome completo em palavras
        const palavras = nomeCompleto.split(' ');
    
        // Formate o primeiro nome
        let primeiroNome = palavras[0].charAt(0).toUpperCase() + palavras[0].slice(1).toLowerCase();
    
        // Formate o sobrenome
        let sobrenome = palavras.slice(1).map(palavra => {
            return prefixos.includes(palavra.toLowerCase())
                ? palavra.toLowerCase()
                : palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        }).join(' ');
    
        // Combine o primeiro nome e o sobrenome formatados
        let nomeFormatado = `${primeiroNome} ${sobrenome}`;
    
        return nomeFormatado;
        }else{
            return 'não selecionado'
        }
        
    }
}


module.exports = {
    commission
};