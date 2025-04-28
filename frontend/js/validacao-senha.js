// Arquivo JavaScript para validação de senha
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

window.validacaoSenha = {
    // Obter requisitos de senha
    getRequisitos: function() {
        return [
            'Mínimo de 8 caracteres',
            'Pelo menos uma letra maiúscula',
            'Pelo menos uma letra minúscula',
            'Pelo menos um número',
            'Pelo menos um caractere especial (ex: !@#$%^&*)'
        ];
    },
    
    // Validar senha
    validar: function(senha) {
        const errors = [];
        
        // Verificar comprimento mínimo
        if (senha.length < 8) {
            errors.push('A senha deve ter pelo menos 8 caracteres');
        }
        
        // Verificar letra maiúscula
        if (!/[A-Z]/.test(senha)) {
            errors.push('A senha deve conter pelo menos uma letra maiúscula');
        }
        
        // Verificar letra minúscula
        if (!/[a-z]/.test(senha)) {
            errors.push('A senha deve conter pelo menos uma letra minúscula');
        }
        
        // Verificar número
        if (!/[0-9]/.test(senha)) {
            errors.push('A senha deve conter pelo menos um número');
        }
        
        // Verificar caractere especial
        const specialCharsRegex = new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
        if (!specialCharsRegex.test(senha)) {
            errors.push('A senha deve conter pelo menos um caractere especial');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    // Calcular força da senha
    calcularForca: function(senha) {
        if (!senha) return 0;
        
        let pontos = 0;
        
        // Comprimento
        pontos += Math.min(senha.length * 4, 25);
        
        // Letras maiúsculas
        const maiusculas = senha.match(/[A-Z]/g);
        pontos += maiusculas ? maiusculas.length * 3 : 0;
        
        // Letras minúsculas
        const minusculas = senha.match(/[a-z]/g);
        pontos += minusculas ? minusculas.length * 2 : 0;
        
        // Números
        const numeros = senha.match(/[0-9]/g);
        pontos += numeros ? numeros.length * 4 : 0;
        
        // Caracteres especiais
        const especiais = senha.match(new RegExp(`[${SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`, 'g'));
        pontos += especiais ? especiais.length * 5 : 0;
        
        // Normalizar para 0-100
        return Math.min(Math.round(pontos), 100);
    }
};
