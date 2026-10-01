/* =========================================================
   QUANTO SOBRA — APP.JS
   Parte 1: saldo + cálculo + estrutura inicial
   ========================================================= */

const STORAGE_KEY = "quanto_sobra_dados";


/* =========================================================
   ESTADO INICIAL
   ========================================================= */

const estadoInicial = {
    saldoAtual: 0,

    mesAtual: "2026-09",

    meses: {
        "2026-09": {
            gastos: []
        }
    }
};


/* =========================================================
   CARREGAR DADOS
   ========================================================= */

function carregarDados() {

    const dadosSalvos = localStorage.getItem(STORAGE_KEY);

    if (!dadosSalvos) {
        return structuredClone(estadoInicial);
    }

    try {

        const dados = JSON.parse(dadosSalvos);

        return {
            ...structuredClone(estadoInicial),
            ...dados,

            meses: {
                ...structuredClone(estadoInicial.meses),
                ...(dados.meses || {})
            }
        };

    } catch (erro) {

        console.error("Erro ao carregar dados:", erro);

        return structuredClone(estadoInicial);
    }
}


let dados = carregarDados();


/* =========================================================
   SALVAR
   ========================================================= */

function salvarDados() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(dados)
    );
}


/* =========================================================
   MÊS ATUAL
   ========================================================= */

function obterMesAtual() {

    if (!dados.meses[dados.mesAtual]) {

        dados.meses[dados.mesAtual] = {
            gastos: []
        };

    }

    return dados.meses[dados.mesAtual];
}


/* =========================================================
   FORMATAÇÃO DE DINHEIRO
   ========================================================= */

function formatarMoeda(valor) {

    return Number(valor || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );
}


/* =========================================================
   FORMATAÇÃO DO MÊS
   ========================================================= */

function formatarMes(mes) {

    const [ano, numeroMes] = mes.split("-");

    const data = new Date(
        Number(ano),
        Number(numeroMes) - 1,
        1
    );

    return data.toLocaleDateString(
        "pt-BR",
        {
            month: "long",
            year: "numeric"
        }
    );
}


/* =========================================================
   CÁLCULO DOS GASTOS
   ========================================================= */

function calcularTotais() {

    const mes = obterMesAtual();

    let previsto = 0;
    let realizado = 0;
    let aindaPrecisaGastar = 0;

    mes.gastos.forEach(gasto => {

        const valorPrevisto =
            Number(gasto.previsto) || 0;

        const valorRealizado =
            Number(gasto.realizado) || 0;

        previsto += valorPrevisto;

        realizado += valorRealizado;

        aindaPrecisaGastar += Math.max(
            0,
            valorPrevisto - valorRealizado
        );

    });


    const quantoSobra =
        Number(dados.saldoAtual || 0)
        - aindaPrecisaGastar;


    return {

        previsto,

        realizado,

        aindaPrecisaGastar,

        quantoSobra

    };
}


/* =========================================================
   ATUALIZAR TELA
   ========================================================= */

function atualizarTela() {

    const totais = calcularTotais();


    /* -----------------------------------------
       MÊS
       ----------------------------------------- */

    document.getElementById(
        "mesAtual"
    ).textContent = formatarMes(
        dados.mesAtual
    );


    /* -----------------------------------------
       QUANTO SOBRA
       ----------------------------------------- */

    document.getElementById(
        "quantoSobra"
    ).textContent = formatarMoeda(
        totais.quantoSobra
    );


    /* -----------------------------------------
       SALDO
       ----------------------------------------- */

    document.getElementById(
        "saldoAtual"
    ).textContent = formatarMoeda(
        dados.saldoAtual
    );


    /* -----------------------------------------
       AINDA PRECISO GASTAR
       ----------------------------------------- */

    document.getElementById(
        "aindaPrecisoGastar"
    ).textContent = formatarMoeda(
        totais.aindaPrecisaGastar
    );


    /* -----------------------------------------
       TOTAL PREVISTO
       ----------------------------------------- */

    document.getElementById(
        "totalPrevisto"
    ).textContent = formatarMoeda(
        totais.previsto
    );


    /* -----------------------------------------
       TOTAL REALIZADO
       ----------------------------------------- */

    document.getElementById(
        "totalRealizado"
    ).textContent = formatarMoeda(
        totais.realizado
    );


    atualizarListaGastos();

}


/* =========================================================
   LISTA DE GASTOS
   ========================================================= */

function atualizarListaGastos() {

    const elemento =
        document.getElementById("listaGastos");

    const gastos =
        obterMesAtual().gastos;


    if (gastos.length === 0) {

        elemento.innerHTML = `
            <div class="vazio">
                Nenhum gasto cadastrado.
            </div>
        `;

        return;
    }


    elemento.innerHTML = gastos
        .slice(0, 5)
        .map(criarCardGasto)
        .join("");

}


/* =========================================================
   CARD DE GASTO
   ========================================================= */

function criarCardGasto(gasto) {

    const previsto =
        Number(gasto.previsto) || 0;

    const realizado =
        Number(gasto.realizado) || 0;

    const restante =
        Math.max(
            0,
            previsto - realizado
        );


    let status = "Pendente";
    let classeStatus = "pendente";

    if (realizado >= previsto) {

        status = "Concluído";
        classeStatus = "concluido";

    } else if (realizado > 0) {

        status = "Parcial";
        classeStatus = "parcial";

    }


    return `
        <div class="gasto-item">

            <div class="gasto-topo">

                <div>

                    <div class="gasto-descricao">
                        ${escaparHTML(gasto.descricao)}
                    </div>

                    <div class="gasto-categoria">
                        ${escaparHTML(gasto.categoria || "Sem categoria")}
                    </div>

                </div>

                <span class="status ${classeStatus}">
                    ${status}
                </span>

            </div>


            <div class="gasto-valores">

                <span class="gasto-previsto">
                    Previsto ${formatarMoeda(previsto)}
                </span>

                <span class="gasto-restante ${classeStatus}">
                    ${
                        restante > 0
                            ? `Falta ${formatarMoeda(restante)}`
                            : "Concluído"
                    }
                </span>

            </div>

        </div>
    `;
}


/* =========================================================
   PROTEÇÃO CONTRA HTML
   ========================================================= */

function escaparHTML(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   EDITAR SALDO
   ========================================================= */

function abrirEditarSaldo() {

    abrirModal(
        "Editar saldo",
        `
            <p style="color:#6b7280;font-size:13px;">
                Informe quanto dinheiro você realmente tem
                disponível agora.
            </p>

            <div class="form-grupo">

                <label for="inputSaldo">
                    Saldo atual
                </label>

                <input
                    id="inputSaldo"
                    type="number"
                    step="0.01"
                    inputmode="decimal"
                    value="${dados.saldoAtual}"
                >

            </div>

            <div class="form-acoes">

                <button
                    class="btn-secundario"
                    onclick="fecharModal()"
                >
                    Cancelar
                </button>

                <button
                    class="btn-confirmar"
                    onclick="salvarSaldo()"
                >
                    Salvar
                </button>

            </div>
        `
    );

}


function salvarSaldo() {

    const input =
        document.getElementById("inputSaldo");

    const valor =
        Number(input.value);


    if (Number.isNaN(valor)) {

        alert("Informe um valor válido.");

        return;
    }


    dados.saldoAtual = valor;

    salvarDados();

    fecharModal();

    atualizarTela();

}


/* =========================================================
   MODAL
   ========================================================= */

function abrirModal(titulo, conteudo) {

    const modal =
        document.getElementById("modal");

    document.getElementById(
        "modalTitulo"
    ).textContent = titulo;

    document.getElementById(
        "modalCorpo"
    ).innerHTML = conteudo;

    modal.classList.remove("escondido");

}


function fecharModal() {

    document
        .getElementById("modal")
        .classList.add("escondido");

}


/* =========================================================
   BOTÃO ADICIONAR GASTO
   ========================================================= */

function abrirAdicionarGasto() {

    /*
     * O formulário completo de gastos
     * entra na próxima etapa.
     */

    abrirModal(
        "Novo gasto",
        `
            <p style="color:#6b7280;font-size:14px;">
                O cadastro completo de gastos será
                adicionado na próxima etapa.
            </p>

            <div class="form-acoes">

                <button
                    class="btn-confirmar"
                    onclick="fecharModal()"
                >
                    Entendi
                </button>

            </div>
        `
    );

}


/* =========================================================
   NAVEGAÇÃO — POR ENQUANTO
   ========================================================= */

function navegar(tela) {

    if (tela === "inicio") {

        atualizarTela();

        return;
    }


    /*
     * As outras telas serão implementadas
     * nas próximas etapas.
     */

    abrirModal(
        "Em construção",
        `
            <p style="color:#6b7280;font-size:14px;">
                Esta parte do Quanto Sobra entra
                nas próximas etapas do desenvolvimento.
            </p>

            <div class="form-acoes">

                <button
                    class="btn-confirmar"
                    onclick="fecharModal()"
                >
                    OK
                </button>

            </div>
        `
    );

}


/* =========================================================
   EVENTOS
   ========================================================= */

document
    .getElementById("btnEditarSaldo")
    .addEventListener(
        "click",
        abrirEditarSaldo
    );


document
    .getElementById("btnAdicionarGasto")
    .addEventListener(
        "click",
        abrirAdicionarGasto
    );


document
    .getElementById("fecharModal")
    .addEventListener(
        "click",
        fecharModal
    );


document
    .getElementById("btnVerGastos")
    .addEventListener(
        "click",
        function () {
            navegar("gastos");
        }
    );


document
    .querySelectorAll(".navegacao button")
    .forEach(botao => {

        botao.addEventListener(
            "click",
            function () {

                document
                    .querySelectorAll(".navegacao button")
                    .forEach(item => {
                        item.classList.remove(
                            "nav-ativo"
                        );
                    });


                this.classList.add(
                    "nav-ativo"
                );


                navegar(
                    this.dataset.tela
                );

            }
        );

    });


/* =========================================================
   FECHAR MODAL CLICANDO FORA
   ========================================================= */

document
    .getElementById("modal")
    .addEventListener(
        "click",
        function (evento) {

            if (
                evento.target === this
            ) {

                fecharModal();

            }

        }
    );


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

atualizarTela();
