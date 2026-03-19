# Sistema de Referências Cardiológicas - Especificação Técnica

> [!IMPORTANT]
> Consolidação de padrões para Eletrocardiograma (ECG), Ecocardiograma (ECO) e Pressão Arterial (PAS), incluindo diretrizes ACVIM (2018).

## 1. Visão Geral
Este documento define as métricas padrão para automação de laudos cardiológicos. O objetivo é permitir que o frontend exiba alertas automáticos ("Normal", "Aumentado", "Diminuído") baseado nos inputs do usuário.

## 2. Modelagem de Dados (Backend)

Similar ao ultrassom, recomenda-se uma tabela `cardiology_reference_standards`.

```python
# models/cardiology_reference.py (Sugestão)
class CardiologyReferenceStandard(db.Model):
    __tablename__ = 'cardiology_reference_standards'
    id = db.Column(db.Integer, primary_key=True)
    species = db.Column(db.String(50)) # 'canine', 'feline'
    modality = db.Column(db.String(50)) # 'ECG', 'ECHO', 'BP'
    parameter = db.Column(db.String(100)) # 'P_duration', 'LA_Ao', 'Systolic_BP'
    
    # Ex: {"min": 60, "max": 130, "unit": "ms"}
    min_val = db.Column(db.Float, nullable=True)
    max_val = db.Column(db.Float, nullable=True)
    unit = db.Column(db.String(20))
    
    classification_rules = db.Column(JSONB) # Regras complexas (ex: ACVIM risks)
```

## 3. "Bíblia" de Referências Cardiológicas (Dados para Seed)

### 3.1. Eletrocardiograma (ECG)
*Limites Superiores Normais (Lead II)*

| Parâmetro | Unidade | Cão (<20kg) | Cão (>20kg) | Gato |
| :--- | :--- | :--- | :--- | :--- |
| **Onda P (Duração)** | ms | < 40 | < 40 | < 40 |
| **Onda P (Amplitude)** | mV | < 0.4 | < 0.4 | < 0.2 |
| **Intervalo PR** | ms | 60 - 130 | 60 - 130 | 50 - 90 |
| **Complexo QRS (Duração)** | ms | < 50 | < 60 (Giant <65) | < 40 |
| **Intervalo QT** | ms | 150 - 250* | 150 - 250* | 120 - 180 |
| **Eixo Elétrico (MEA)** | graus | +40 a +100 | +40 a +100 | 0 a +160 |

*Nota: QT varia com FC. Corrigido (QTc) é mais preciso, mas valores absolutos servem de triagem.*

### 3.2. Pressão Arterial (ACVIM 2018 Consensus)
*Classificação de Risco de Lesão em Órgão Alvo (TOD)*

| Categoria | PAS (Sistólica) mmHg | Risco de TOD | Ação Recomendada |
| :--- | :--- | :--- | :--- |
| **Normotenso** | < 140 | Mínimo | Reavaliar anualmente |
| **Pré-hipertenso** | 140 - 159 | Baixo | Reavaliar s/estresse |
| **Hipertenso** | 160 - 179 | Moderado | Tratar se TOD presente |
| **Hipertenso Severo** | ≥ 180 | Alto | Tratar imediatamente |

*   **PAD (Diastólica)** referência: < 90 mmHg (Normotenso).
*   **HDO (High Definition Oscillometry)**: Observar não apenas o valor, mas o "Envelope" (gráfico). Ondas de grande amplitude sugerem alta pressão de pulso (ex: insuficiência aórtica).

### 3.3. Ecocardiograma (ECO)
*Valores de Referência Gerais*

| Parâmetro | Cão (Geral) | Gato (Geral) | Significado Clínico |
| :--- | :--- | :--- | :--- |
| **Relação AE/Ao (LA/Ao)** | < 1.6 | < 1.5 | Aumento = Dilatação Atrial Esq. (Risco Edema) |
| **Fração Encurtamento (FS%)** | 25 - 45% | 30 - 55% | <25% = Disfunção Sistólica; >55% = Hipercontrabilidade |
| **Onda E (Velocidade)** | ~0.87 m/s | > Onda A | E < A sugere disfunção diastólica (relaxamento) |
| **Separação Septal Ponto-E (EPSS)** | < 6 mm | < 4 mm | Aumento = Dilatação VE / Baixa contratilidade |
| **Espessura Parede VE (Diástole)** | Raça-dependente | < 6.0 mm | > 6mm = Hipertrofia Concêntrica (CMH em gatos) |

### 3.4. InMonitor (HDO & VFC)
*Parâmetros Avançados de Hemodinâmica*

#### Análise da Onda de Pulso (HDO - PWA)
A morfologia da curva oscilométrica reflete a complacência e resistência vascular.

| Fenótipo Visual (Envelope HDO) | Característica | Correlação Clínica | Ação Sugerida |
| :--- | :--- | :--- | :--- |
| **Pico Agudo (Célere)** | Alta amplitude, curta duração | **Hiperdinâmico**: Estresse, Dor, "White Coat Effect" ou Compensação Inicial. | Avaliar Dor/Ansiedade. Checar RMSSD (VFC). |
| **Platô (Base Larga)** | Descida lenta, base alargada | **Alta Resistência (RVP)**: Rigidez arterial, Hipertensão Crônica (Lesão Endotelial). | Risco de Lesão em Órgão Alvo. Monitorar AIx. |
| **Baixa Amplitude** | Oscilação pequena (Micro) | **Baixo Débito**: Vasoconstrição severa, Choque ou Hipotensão. | Avaliar perfusão/hidratação urgente. |
| **Irregular** | Amplitude variável beat-to-beat | **Arritmia**: Fibrilação Atrial, VPCs ou Instabilidade de Pré-carga. | Realizar ECG urgente. |

#### Variabilidade da Frequência Cardíaca (VFC/HRV)
Indicador de balanço autonômico (Simpático vs. Parassimpático).

*   **SDNN (Global)**: "Termômetro" de saúde autonômica.
    *   *Cães*: < 50ms (Alerta), < 30ms (Crítico - Risco em ICC/CMD).
    *   *Gatos*: Reduzido em DRC e Hipertireoidismo.
*   **RMSSD (Parassimpático/Vagal)**:
    *   *Baixo*: Predomínio Simpático (Estresse, Dor, ICC descompensada).
    *   *Alto*: Predomínio Vagal (Relaxamento, Atletas).
*   **Gráfico de Poincaré (Visual)**:
    *   *"Torpedo"* (Denso/Estreito): Baixa variabilidade extrema (Risco de Morte Súbita em Doberman/Boxer com CMD).
    *   *Disperso/Nuvem*: Boa variabilidade ou Arritmia (se caótico).

---

## 4. Implementação de Lógica (Frontend)

### Exemplo de Lógica de Alerta (Pseudo-código)

```javascript
function analyzeBloodPressure(systolic) {
  if (systolic < 140) return { status: 'success', msg: 'Normotenso (Risco Baixo)' };
  if (systolic < 160) return { status: 'warning', msg: 'Pré-hipertenso (Monitorar)' };
  if (systolic < 180) return { status: 'orange', msg: 'Hipertenso (Risco Moderado)' };
  return { status: 'danger', msg: 'Hipertenso Severo (Risco Alto de TOD)' };
}

function analyzeECG(parameter, value, species, weight) {
   // Busca limite no JSON de referências
   const limit = getReference(species, parameter, weight); 
   if (value > limit.max) return { status: 'danger', msg: `Aumentado (Ref: <${limit.max})` };
   return { status: 'success', msg: 'Normal' };
}
```

## 5. Próximos Passos
1.  **Seed Database**: Inserir estes valores na tabela `cardiology_reference_standards`.
2.  **Frontend Components**: Criar componentes de input para ECG/ECO que validam em tempo real.
3.  **Relatórios**: Gerar PDF com a classificação de risco ACVIM automática.
