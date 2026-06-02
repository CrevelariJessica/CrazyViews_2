{
    const injetarModais = () => {
        if (document.getElementById('modalEdicaoTitulo')) return;

        const container = document.createElement('div');
        container.id = "global_modal_container";
        container.innerHTML = `
            <div id="modalEdicaoTitulo" class="modal" style="display: none;">
                <div class="modal-content modal-edit-style">
                    <div>
                        <h3>EDITAR DETALHES</h3>
                        <span class="close-button" onclick="fecharModalEdicao()">&times;</span>
                    </div>
                    <form id="formEdicaoTitulo">
                        <input type="hidden" id="edit_id_titulo" name="id_titulo" value="">
                        <div class="id_ContainerGroupFav">
                            <label>Título Local:</label>
                            <input type="text" id="edit_titulo" name="titulo" required>
                        </div>
                        <div class="id_ContainerGroupFav">
                            <label>Título Original:</label>
                            <input type="text" id="edit_original" name="original">
                        </div>
                        <div class="container123">
                            <div class="id_ContainerGroupFav">
                                <label>Gênero:</label>
                                <input type="text" id="edit_genero" name="genero" required>
                            </div>
                            <div class="id_ContainerGroupFav">
                                <label>Editora:</label>
                                <input type="text" id="edit_Publisher" name="editora" required>
                            </div>
                        </div>
                        <div class="id_ContainerGroupFav">
                            <label>Ano:</label>
                            <input type="text" id="edit_lancamento" name="lancamento" maxlength="4" required>
                        </div>
                        <div class="container456">
                            <button type="button" onclick="fecharModalEdicao()">Cancelar</button>
                            <button type="submit" id="saveButton" class="btn-edit">Salvar <span id="editSpinner" class="spinner"></span></button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="modalConfirmacaoExclusao" class="modal" style="display: none;">
                <div class="modal-content modal-delete-style">
                    <h3>CONFIRMAÇÃO DE EXCLUSÃO</h3>
                    <p>Tem certeza que deseja deletar este título permanentemente?</p>
                    <div class="modal-actions">
                        <button class="btn-cancel" onclick="fecharModalConfirmacao()">Cancelar</button>
                        <button class="btn-delete" onclick="deletarTitulo()">Sim, Deletar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    };

    injetarModais();
}