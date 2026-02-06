'use client';

import { useState } from 'react';
import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumbs';
import { FiInfo } from 'react-icons/fi';
import styles from './tabela-medidas.module.scss';

type Categoria = 'camisetas' | 'calcas' | 'vestidos' | 'calcados' | 'acessorios';

export default function TabelaMedidasPage() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<Categoria>('camisetas');

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Tabela de Medidas' }]} />

        <div className={styles.hero}>
          <h1>Guia de Tamanhos</h1>
          <p>Encontre o tamanho perfeito para você</p>
        </div>

        <div className={styles.content}>
          <section className={styles.alert}>
            <FiInfo className={styles.alertIcon} />
            <div>
              <strong>Dica importante:</strong> As medidas são em centímetros (cm) e 
              representam as dimensões do corpo, não da peça. Em caso de dúvida entre 
              dois tamanhos, opte pelo maior para maior conforto.
            </div>
          </section>

          <section className={styles.categorias}>
            <button
              className={`${styles.categoriaBtn} ${categoriaAtiva === 'camisetas' ? styles.active : ''}`}
              onClick={() => setCategoriaAtiva('camisetas')}
            >
              Camisetas e Tops
            </button>
            <button
              className={`${styles.categoriaBtn} ${categoriaAtiva === 'calcas' ? styles.active : ''}`}
              onClick={() => setCategoriaAtiva('calcas')}
            >
              Calças e Shorts
            </button>
            <button
              className={`${styles.categoriaBtn} ${categoriaAtiva === 'vestidos' ? styles.active : ''}`}
              onClick={() => setCategoriaAtiva('vestidos')}
            >
              Vestidos e Saias
            </button>
            <button
              className={`${styles.categoriaBtn} ${categoriaAtiva === 'calcados' ? styles.active : ''}`}
              onClick={() => setCategoriaAtiva('calcados')}
            >
              Calçados
            </button>
            <button
              className={`${styles.categoriaBtn} ${categoriaAtiva === 'acessorios' ? styles.active : ''}`}
              onClick={() => setCategoriaAtiva('acessorios')}
            >
              Acessórios
            </button>
          </section>

          {categoriaAtiva === 'camisetas' && (
            <section className={styles.tabelaSection}>
              <h2>Camisetas, Blusas e Tops</h2>
              <p>Medidas de busto, cintura e comprimento</p>
              
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tamanho</th>
                      <th>Busto (cm)</th>
                      <th>Cintura (cm)</th>
                      <th>Quadril (cm)</th>
                      <th>Comprimento (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PP</strong></td>
                      <td>80-84</td>
                      <td>60-64</td>
                      <td>86-90</td>
                      <td>60-62</td>
                    </tr>
                    <tr>
                      <td><strong>P</strong></td>
                      <td>84-88</td>
                      <td>64-68</td>
                      <td>90-94</td>
                      <td>62-64</td>
                    </tr>
                    <tr>
                      <td><strong>M</strong></td>
                      <td>88-92</td>
                      <td>68-72</td>
                      <td>94-98</td>
                      <td>64-66</td>
                    </tr>
                    <tr>
                      <td><strong>G</strong></td>
                      <td>92-96</td>
                      <td>72-76</td>
                      <td>98-102</td>
                      <td>66-68</td>
                    </tr>
                    <tr>
                      <td><strong>GG</strong></td>
                      <td>96-100</td>
                      <td>76-80</td>
                      <td>102-106</td>
                      <td>68-70</td>
                    </tr>
                    <tr>
                      <td><strong>XGG</strong></td>
                      <td>100-106</td>
                      <td>80-86</td>
                      <td>106-112</td>
                      <td>70-72</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {categoriaAtiva === 'calcas' && (
            <section className={styles.tabelaSection}>
              <h2>Calças, Shorts e Bermudas</h2>
              <p>Medidas de cintura, quadril e comprimento</p>
              
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tamanho</th>
                      <th>Cintura (cm)</th>
                      <th>Quadril (cm)</th>
                      <th>Gancho (cm)</th>
                      <th>Comprimento (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>36</strong></td>
                      <td>60-64</td>
                      <td>86-90</td>
                      <td>24-26</td>
                      <td>100-102</td>
                    </tr>
                    <tr>
                      <td><strong>38</strong></td>
                      <td>64-68</td>
                      <td>90-94</td>
                      <td>26-28</td>
                      <td>102-104</td>
                    </tr>
                    <tr>
                      <td><strong>40</strong></td>
                      <td>68-72</td>
                      <td>94-98</td>
                      <td>28-30</td>
                      <td>104-106</td>
                    </tr>
                    <tr>
                      <td><strong>42</strong></td>
                      <td>72-76</td>
                      <td>98-102</td>
                      <td>30-32</td>
                      <td>106-108</td>
                    </tr>
                    <tr>
                      <td><strong>44</strong></td>
                      <td>76-80</td>
                      <td>102-106</td>
                      <td>32-34</td>
                      <td>108-110</td>
                    </tr>
                    <tr>
                      <td><strong>46</strong></td>
                      <td>80-86</td>
                      <td>106-112</td>
                      <td>34-36</td>
                      <td>110-112</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {categoriaAtiva === 'vestidos' && (
            <section className={styles.tabelaSection}>
              <h2>Vestidos, Saias e Macacões</h2>
              <p>Medidas de busto, cintura, quadril e comprimento</p>
              
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Tamanho</th>
                      <th>Busto (cm)</th>
                      <th>Cintura (cm)</th>
                      <th>Quadril (cm)</th>
                      <th>Comprimento (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>PP</strong></td>
                      <td>80-84</td>
                      <td>60-64</td>
                      <td>86-90</td>
                      <td>88-92</td>
                    </tr>
                    <tr>
                      <td><strong>P</strong></td>
                      <td>84-88</td>
                      <td>64-68</td>
                      <td>90-94</td>
                      <td>90-94</td>
                    </tr>
                    <tr>
                      <td><strong>M</strong></td>
                      <td>88-92</td>
                      <td>68-72</td>
                      <td>94-98</td>
                      <td>92-96</td>
                    </tr>
                    <tr>
                      <td><strong>G</strong></td>
                      <td>92-96</td>
                      <td>72-76</td>
                      <td>98-102</td>
                      <td>94-98</td>
                    </tr>
                    <tr>
                      <td><strong>GG</strong></td>
                      <td>96-100</td>
                      <td>76-80</td>
                      <td>102-106</td>
                      <td>96-100</td>
                    </tr>
                    <tr>
                      <td><strong>XGG</strong></td>
                      <td>100-106</td>
                      <td>80-86</td>
                      <td>106-112</td>
                      <td>98-102</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {categoriaAtiva === 'calcados' && (
            <section className={styles.tabelaSection}>
              <h2>Calçados</h2>
              <p>Equivalência de tamanhos e medidas em centímetros</p>
              
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Brasil</th>
                      <th>USA</th>
                      <th>EUR</th>
                      <th>Comprimento do Pé (cm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>33</strong></td>
                      <td>5</td>
                      <td>35</td>
                      <td>21.5-22.0</td>
                    </tr>
                    <tr>
                      <td><strong>34</strong></td>
                      <td>6</td>
                      <td>36</td>
                      <td>22.0-22.5</td>
                    </tr>
                    <tr>
                      <td><strong>35</strong></td>
                      <td>7</td>
                      <td>37</td>
                      <td>22.5-23.0</td>
                    </tr>
                    <tr>
                      <td><strong>36</strong></td>
                      <td>8</td>
                      <td>38</td>
                      <td>23.0-23.5</td>
                    </tr>
                    <tr>
                      <td><strong>37</strong></td>
                      <td>9</td>
                      <td>39</td>
                      <td>23.5-24.0</td>
                    </tr>
                    <tr>
                      <td><strong>38</strong></td>
                      <td>10</td>
                      <td>40</td>
                      <td>24.0-24.5</td>
                    </tr>
                    <tr>
                      <td><strong>39</strong></td>
                      <td>11</td>
                      <td>41</td>
                      <td>24.5-25.0</td>
                    </tr>
                    <tr>
                      <td><strong>40</strong></td>
                      <td>12</td>
                      <td>42</td>
                      <td>25.0-25.5</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={styles.dica}>
                <FiInfo />
                <p>
                  <strong>Como medir seu pé:</strong> Coloque uma folha no chão encostada 
                  na parede. Apoie o calcanhar na parede e marque onde termina o dedo 
                  mais longo. Meça a distância da parede até a marca.
                </p>
              </div>
            </section>
          )}

          {categoriaAtiva === 'acessorios' && (
            <section className={styles.tabelaSection}>
              <h2>Acessórios</h2>
              
              <div className={styles.accessoriesGrid}>
                <div className={styles.accessoryCard}>
                  <h3>Cintos</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Tamanho</th>
                          <th>Cintura (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>P</strong></td>
                          <td>70-80</td>
                        </tr>
                        <tr>
                          <td><strong>M</strong></td>
                          <td>80-90</td>
                        </tr>
                        <tr>
                          <td><strong>G</strong></td>
                          <td>90-100</td>
                        </tr>
                        <tr>
                          <td><strong>GG</strong></td>
                          <td>100-110</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className={styles.accessoryCard}>
                  <h3>Bonés e Chapéus</h3>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Tamanho</th>
                          <th>Circunferência (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>P</strong></td>
                          <td>54-56</td>
                        </tr>
                        <tr>
                          <td><strong>M</strong></td>
                          <td>56-58</td>
                        </tr>
                        <tr>
                          <td><strong>G</strong></td>
                          <td>58-60</td>
                        </tr>
                        <tr>
                          <td><strong>GG</strong></td>
                          <td>60-62</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className={styles.howToMeasure}>
            <h2>Como Tirar Suas Medidas</h2>
            <p>Siga estas instruções para medir corretamente seu corpo:</p>

            <div className={styles.measureGrid}>
              <div className={styles.measureCard}>
                <div className={styles.measureNumber}>1</div>
                <h3>Busto</h3>
                <p>
                  Passe a fita métrica ao redor da parte mais cheia do busto, 
                  mantendo a fita paralela ao chão. Não aperte muito.
                </p>
              </div>

              <div className={styles.measureCard}>
                <div className={styles.measureNumber}>2</div>
                <h3>Cintura</h3>
                <p>
                  Meça a parte mais estreita do tronco, geralmente acima do umbigo. 
                  Mantenha a fita justa, mas confortável.
                </p>
              </div>

              <div className={styles.measureCard}>
                <div className={styles.measureNumber}>3</div>
                <h3>Quadril</h3>
                <p>
                  Meça ao redor da parte mais larga dos quadris, aproximadamente 
                  20cm abaixo da cintura.
                </p>
              </div>

              <div className={styles.measureCard}>
                <div className={styles.measureNumber}>4</div>
                <h3>Comprimento</h3>
                <p>
                  Para camisetas: da base do pescoço até a altura desejada. 
                  Para calças: da cintura até o tornozelo.
                </p>
              </div>
            </div>

            <div className={styles.tips}>
              <h3>Dicas Importantes</h3>
              <ul>
                <li>Use uma fita métrica flexível</li>
                <li>Vista apenas roupas íntimas leves durante a medição</li>
                <li>Mantenha o corpo relaxado e em postura natural</li>
                <li>Peça ajuda de outra pessoa para maior precisão</li>
                <li>Anote as medidas e compare com nossas tabelas</li>
                <li>Em caso de dúvida entre dois tamanhos, escolha o maior</li>
              </ul>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Dúvidas sobre Tamanhos?</h2>
            <p>
              Nossa equipe pode ajudar você a escolher o tamanho ideal. Entre em contato:
            </p>
            <div className={styles.contact}>
              <p><strong>WhatsApp:</strong> (11) 99338-5579</p>
              <p><strong>E-mail:</strong> contato@point55.com.br</p>
              <p><strong>Horário:</strong> Segunda a sexta, 9h às 18h</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
