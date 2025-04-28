// Dados de demonstração para o sistema LOC Seguro
window.demoStorage = {
    // Locadoras fictícias
    locadoras: [
        {
            usuario_id: 1,
            nome_fantasia: "AutoFlex Locadora",
            razao_social: "AutoFlex Locações LTDA",
            cnpj: "12.345.678/0001-90",
            telefone: "(11) 3456-7890",
            endereco: "Av. Paulista, 1000, São Paulo - SP",
            avaliacao_media: 4.7,
            total_avaliacoes: 23
        },
        {
            usuario_id: 2,
            nome_fantasia: "CarroJá Locadora",
            razao_social: "CarroJá Serviços de Locação LTDA",
            cnpj: "98.765.432/0001-21",
            telefone: "(21) 2345-6789",
            endereco: "Av. Atlântica, 500, Rio de Janeiro - RJ",
            avaliacao_media: 4.3,
            total_avaliacoes: 18
        }
    ],
    
    // Locatários fictícios
    locatarios: [
        {
            usuario_id: 3,
            nome: "Ana Silva",
            cpf: "123.456.789-00",
            telefone: "(11) 91234-5678",
            endereco: "Rua das Flores, 123, São Paulo - SP",
            cnh: "12345678900",
            avaliacao_media: 4.8,
            total_avaliacoes: 12
        },
        {
            usuario_id: 4,
            nome: "Carlos Oliveira",
            cpf: "987.654.321-00",
            telefone: "(21) 98765-4321",
            endereco: "Rua do Sol, 456, Rio de Janeiro - RJ",
            cnh: "09876543211",
            avaliacao_media: 4.5,
            total_avaliacoes: 8
        },
        {
            usuario_id: 5,
            nome: "Mariana Santos",
            cpf: "456.789.123-00",
            telefone: "(31) 94567-8912",
            endereco: "Av. Central, 789, Belo Horizonte - MG",
            cnh: "45678912345",
            avaliacao_media: 4.9,
            total_avaliacoes: 15
        },
        {
            usuario_id: 6,
            nome: "Pedro Costa",
            cpf: "321.654.987-00",
            telefone: "(41) 93216-5498",
            endereco: "Rua das Araucárias, 321, Curitiba - PR",
            cnh: "32165498765",
            avaliacao_media: 4.2,
            total_avaliacoes: 6
        },
        {
            usuario_id: 7,
            nome: "Juliana Lima",
            cpf: "654.321.987-00",
            telefone: "(51) 96543-2198",
            endereco: "Av. Ipiranga, 654, Porto Alegre - RS",
            cnh: "65432198765",
            avaliacao_media: 4.6,
            total_avaliacoes: 10
        },
        {
            usuario_id: 8,
            nome: "Roberto Almeida",
            cpf: "789.123.456-00",
            telefone: "(81) 97891-2345",
            endereco: "Rua da Praia, 987, Recife - PE",
            cnh: "78912345678",
            avaliacao_media: 4.4,
            total_avaliacoes: 9
        }
    ],
    
    // Carros fictícios
    carros: [
        // Carros da AutoFlex Locadora (ID 1)
        {
            id: 1,
            locadora_id: 1,
            marca: "Toyota",
            modelo: "Corolla",
            ano: 2023,
            placa: "ABC1D23",
            cor: "Prata",
            quilometragem: 15000,
            valor_diaria: 150.00,
            disponivel: true
        },
        {
            id: 2,
            locadora_id: 1,
            marca: "Honda",
            modelo: "Civic",
            ano: 2022,
            placa: "DEF4G56",
            cor: "Preto",
            quilometragem: 22000,
            valor_diaria: 140.00,
            disponivel: true
        },
        {
            id: 3,
            locadora_id: 1,
            marca: "Jeep",
            modelo: "Renegade",
            ano: 2023,
            placa: "GHI7J89",
            cor: "Branco",
            quilometragem: 18000,
            valor_diaria: 180.00,
            disponivel: false
        },
        {
            id: 4,
            locadora_id: 1,
            marca: "Volkswagen",
            modelo: "T-Cross",
            ano: 2022,
            placa: "JKL1M23",
            cor: "Vermelho",
            quilometragem: 25000,
            valor_diaria: 170.00,
            disponivel: true
        },
        {
            id: 5,
            locadora_id: 1,
            marca: "Hyundai",
            modelo: "HB20",
            ano: 2023,
            placa: "NOP4Q56",
            cor: "Azul",
            quilometragem: 12000,
            valor_diaria: 120.00,
            disponivel: true
        },
        
        // Carros da CarroJá Locadora (ID 2)
        {
            id: 6,
            locadora_id: 2,
            marca: "Fiat",
            modelo: "Pulse",
            ano: 2023,
            placa: "QRS7T89",
            cor: "Cinza",
            quilometragem: 10000,
            valor_diaria: 130.00,
            disponivel: true
        },
        {
            id: 7,
            locadora_id: 2,
            marca: "Chevrolet",
            modelo: "Onix",
            ano: 2022,
            placa: "UVW1X23",
            cor: "Prata",
            quilometragem: 20000,
            valor_diaria: 110.00,
            disponivel: true
        },
        {
            id: 8,
            locadora_id: 2,
            marca: "Renault",
            modelo: "Kwid",
            ano: 2023,
            placa: "YZA4B56",
            cor: "Branco",
            quilometragem: 8000,
            valor_diaria: 90.00,
            disponivel: false
        },
        {
            id: 9,
            locadora_id: 2,
            marca: "Nissan",
            modelo: "Kicks",
            ano: 2022,
            placa: "CDE7F89",
            cor: "Preto",
            quilometragem: 18000,
            valor_diaria: 160.00,
            disponivel: true
        },
        {
            id: 10,
            locadora_id: 2,
            marca: "Ford",
            modelo: "Territory",
            ano: 2023,
            placa: "GHI1J23",
            cor: "Marrom",
            quilometragem: 15000,
            valor_diaria: 190.00,
            disponivel: true
        }
    ],
    
    // Locações fictícias
    locacoes: [
        // Locações da AutoFlex Locadora (ID 1)
        {
            id: 1,
            locadora_id: 1,
            locatario_id: 3,
            carro_id: 1,
            data_inicio: "2025-03-10",
            data_fim: "2025-03-15",
            valor_total: 750.00,
            status: "Concluída",
            avaliacao_locadora: {
                nota: 5,
                comentario: "Ótimo cliente, devolveu o carro em perfeitas condições.",
                data: "2025-03-16"
            },
            avaliacao_locatario: {
                nota: 5,
                comentario: "Excelente locadora, carro em ótimo estado e atendimento impecável.",
                data: "2025-03-16"
            }
        },
        {
            id: 2,
            locadora_id: 1,
            locatario_id: 4,
            carro_id: 2,
            data_inicio: "2025-03-20",
            data_fim: "2025-03-25",
            valor_total: 700.00,
            status: "Concluída",
            avaliacao_locadora: {
                nota: 4,
                comentario: "Bom cliente, apenas alguns detalhes na devolução.",
                data: "2025-03-26"
            },
            avaliacao_locatario: {
                nota: 4,
                comentario: "Boa locadora, apenas alguns detalhes no atendimento.",
                data: "2025-03-26"
            }
        },
        {
            id: 3,
            locadora_id: 1,
            locatario_id: 5,
            carro_id: 3,
            data_inicio: "2025-04-01",
            data_fim: "2025-04-10",
            valor_total: 1800.00,
            status: "Em andamento",
            avaliacao_locadora: null,
            avaliacao_locatario: null
        },
        {
            id: 4,
            locadora_id: 1,
            locatario_id: 6,
            carro_id: 4,
            data_inicio: "2025-04-15",
            data_fim: "2025-04-20",
            valor_total: 850.00,
            status: "Agendada",
            avaliacao_locadora: null,
            avaliacao_locatario: null
        },
        {
            id: 5,
            locadora_id: 1,
            locatario_id: 7,
            carro_id: 5,
            data_inicio: "2025-03-05",
            data_fim: "2025-03-08",
            valor_total: 360.00,
            status: "Concluída",
            avaliacao_locadora: {
                nota: 5,
                comentario: "Cliente exemplar, muito educado e cuidadoso com o veículo.",
                data: "2025-03-09"
            },
            avaliacao_locatario: {
                nota: 5,
                comentario: "Locadora excelente, processo rápido e sem burocracia.",
                data: "2025-03-09"
            }
        },
        
        // Locações da CarroJá Locadora (ID 2)
        {
            id: 6,
            locadora_id: 2,
            locatario_id: 8,
            carro_id: 6,
            data_inicio: "2025-03-12",
            data_fim: "2025-03-18",
            valor_total: 780.00,
            status: "Concluída",
            avaliacao_locadora: {
                nota: 4,
                comentario: "Cliente pontual e responsável.",
                data: "2025-03-19"
            },
            avaliacao_locatario: {
                nota: 4,
                comentario: "Locadora com bom atendimento e carro em boas condições.",
                data: "2025-03-19"
            }
        },
        {
            id: 7,
            locadora_id: 2,
            locatario_id: 3,
            carro_id: 7,
            data_inicio: "2025-03-25",
            data_fim: "2025-03-30",
            valor_total: 550.00,
            status: "Concluída",
            avaliacao_locadora: {
                nota: 5,
                comentario: "Cliente excelente, muito educado e pontual.",
                data: "2025-03-31"
            },
            avaliacao_locatario: {
                nota: 4,
                comentario: "Boa locadora, processo de locação simples.",
                data: "2025-03-31"
            }
        },
        {
            id: 8,
            locadora_id: 2,
            locatario_id: 4,
            carro_id: 8,
            data_inicio: "2025-04-05",
            data_fim: "2025-04-12",
            valor_total: 630.00,
            status: "Em andamento",
            avaliacao_locadora: null,
            avaliacao_locatario: null
        },
        {
            id: 9,
            locadora_id: 2,
            locatario_id: 5,
            carro_id: 9,
            data_inicio: "2025-04-18",
            data_fim: "2025-04-25",
            valor_total: 1120.00,
            status: "Agendada",
            avaliacao_locadora: null,
            avaliacao_locatario: null
        },
        {
            id: 10,
            locadora_id: 2,
            locatario_id: 6,
            carro_id: 10,
            data_inicio: "2025-03-01",
            data_fim: "2025-03-05",
            valor_total: 950.00,
            status: "Concluída",
            avaliacao_locadora: {
                nota: 3,
                comentario: "Cliente devolveu o carro com alguns arranhões.",
                data: "2025-03-06"
            },
            avaliacao_locatario: {
                nota: 4,
                comentario: "Locadora com bom atendimento, mas o carro apresentou alguns problemas.",
                data: "2025-03-06"
            }
        }
    ],
    
    // Usuários fictícios
    usuarios: [
        {
            id: 1,
            email: "autoflex@exemplo.com",
            senha: "Autoflex@2025",
            tipo: "locadora",
            cadastro_completo: true
        },
        {
            id: 2,
            email: "carroja@exemplo.com",
            senha: "CarroJa@2025",
            tipo: "locadora",
            cadastro_completo: true
        },
        {
            id: 3,
            email: "ana.silva@exemplo.com",
            senha: "Ana@2025",
            tipo: "locatario",
            cadastro_completo: true
        },
        {
            id: 4,
            email: "carlos.oliveira@exemplo.com",
            senha: "Carlos@2025",
            tipo: "locatario",
            cadastro_completo: true
        },
        {
            id: 5,
            email: "mariana.santos@exemplo.com",
            senha: "Mariana@2025",
            tipo: "locatario",
            cadastro_completo: true
        },
        {
            id: 6,
            email: "pedro.costa@exemplo.com",
            senha: "Pedro@2025",
            tipo: "locatario",
            cadastro_completo: true
        },
        {
            id: 7,
            email: "juliana.lima@exemplo.com",
            senha: "Juliana@2025",
            tipo: "locatario",
            cadastro_completo: true
        },
        {
            id: 8,
            email: "roberto.almeida@exemplo.com",
            senha: "Roberto@2025",
            tipo: "locatario",
            cadastro_completo: true
        }
    ]
};
