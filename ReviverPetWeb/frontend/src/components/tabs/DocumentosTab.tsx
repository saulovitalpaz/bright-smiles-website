import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Plus, FileText, Trash2, Download, Upload, LineChart as ChartIcon, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Document } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import { LudicCard } from "@/components/ui/LudicCard";
import { FileImage, ActivitySquare } from "lucide-react";

interface ExamMetric {
  id: number;
  metric_name: string;
  value: number;
  unit?: string;
  reference_range?: string;
  date: string;
}

interface DocumentosTabProps {
  patientId: number;
  documents: Document[];
  metrics: ExamMetric[];
  onAdd: (doc: any) => void;
  onDelete: (id: number) => void;
  onAddMetric: (metric: any) => void;
  onDeleteMetric: (id: number) => void;
}

const DocumentosTab = ({
  patientId,
  documents,
  metrics,
  onAdd,
  onDelete,
  onAddMetric,
  onDeleteMetric
}: DocumentosTabProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getTodayISO = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    return (new Date(Date.now() - tzOffset)).toISOString().slice(0, 10);
  };

  // States for manual metric entry
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [metricName, setMetricName] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [metricUnit, setMetricUnit] = useState("");
  const [metricReference, setMetricReference] = useState("");
  const [metricDate, setMetricDate] = useState(getTodayISO());
  const [selectedMetricForChart, setSelectedMetricForChart] = useState<string | null>(null);

  // Auto-fill unit and reference when typing a known metric name
  // To avoid circular dependencies, we use a simple effect
  // that runs when metricName changes
  const prevMetricNameRef = useRef(metricName);
  if (metricName !== prevMetricNameRef.current) {
    prevMetricNameRef.current = metricName;
    if (metricName.trim() !== "") {
      const match = metrics.find(m => m.metric_name.toLowerCase() === metricName.trim().toLowerCase());
      if (match) {
        if (!metricUnit && match.unit) setMetricUnit(match.unit);
        if (!metricReference && match.reference_range) setMetricReference(match.reference_range);
      }
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/patients/${patientId}/documents/`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const newDoc = await response.json();
        onAdd({
          id: newDoc.id,
          patientId: newDoc.patient_id,
          name: newDoc.name,
          type: "pdf",
          uploadedAt: new Date(newDoc.uploaded_at).toLocaleDateString("pt-BR"),
        });
        toast({ title: "Documento salvo", description: `O arquivo ${file.name} foi guardado.` });
      }
    } catch (error) {
      toast({ title: "Erro no upload", variant: "destructive" });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveMetric = async () => {
    if (!metricName || metricValue.toString().trim() === "" || !metricDate) return;

    const parsedValue = parseFloat(metricValue.replace(',', '.'));
    if (isNaN(parsedValue)) {
      toast({ title: "Valor inválido", description: "Por favor insira um número válido.", variant: "destructive" });
      return;
    }

    const [year, month, day] = metricDate.split("-");
    const formattedDate = `${day}/${month}/${year}`;

    try {
      const response = await fetch(`/api/patients/${patientId}/metrics/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metric_name: metricName,
          value: parsedValue,
          unit: metricUnit,
          reference_range: metricReference,
          date: formattedDate,
        }),
      });

      if (response.ok) {
        const newMetric = await response.json();
        onAddMetric(newMetric);
        setIsAddingMetric(false);
        setMetricName("");
        setMetricValue("");
        setMetricUnit("");
        setMetricReference("");
        setMetricDate(getTodayISO());
        setSelectedMetricForChart(newMetric.metric_name);
        toast({ title: "Resultado salvo", description: `${metricName} registrado com sucesso.` });
      }
    } catch (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const activeMetrics = Array.from(new Set(metrics.map(m => m.metric_name)));
  
  const parseDate = (d: string) => {
    if (!d) return 0;
    const parts = d.split("/");
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
    return new Date(d).getTime() || 0;
  };

  const chartData = [...metrics]
    .filter(m => m.metric_name === (selectedMetricForChart || activeMetrics[0]))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date))
    .map(m => {
      let refMin, refMax;
      if (m.reference_range) {
        const parts = m.reference_range.split('-').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          refMin = parts[0];
          refMax = parts[1];
        } else if (m.reference_range.includes('<')) {
          const val = parseFloat(m.reference_range.replace(/[^\d.,]/g, '').replace(',', '.'));
          if (!isNaN(val)) {
            refMin = 0;
            refMax = val;
          }
        } else if (m.reference_range.includes('>')) {
          const val = parseFloat(m.reference_range.replace(/[^\d.,]/g, '').replace(',', '.'));
          if (!isNaN(val)) {
            refMin = val;
            refMax = val * 2; // Arbitrary upper bound for visual display
          }
        }
      }
      return {
        date: m.date.substring(0, 5),
        valor: m.value,
        fullDate: m.date,
        refMin,
        refMax
      };
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-foreground">Exames e Resultados</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAddingMetric(!isAddingMetric)}
            className="rounded-xl gap-2 border-primary text-primary hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" /> Resultado Manual
          </Button>
          <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
          <Button onClick={() => fileInputRef.current?.click()} className="rounded-xl gap-2 bg-primary hover:bg-primary-light">
            <Upload className="h-4 w-4" /> Enviar Arquivo
          </Button>
        </div>
      </div>

      {/* Manual Entry Form */}
      <AnimatePresence>
        {isAddingMetric && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Métrica (Ex: Ureia)</Label>
                  <Input value={metricName} onChange={e => setMetricName(e.target.value)} placeholder="Ex: ALT" className="bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Valor</Label>
                  <Input type="text" inputMode="decimal" value={metricValue} onChange={e => setMetricValue(e.target.value)} placeholder="0.0" className="bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Unidade</Label>
                  <Input value={metricUnit} onChange={e => setMetricUnit(e.target.value)} placeholder="mg/dL" className="bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Referência</Label>
                  <Input value={metricReference} onChange={e => setMetricReference(e.target.value)} placeholder="10-50" className="bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold uppercase">Data</Label>
                  <Input type="date" value={metricDate} onChange={e => setMetricDate(e.target.value)} className="bg-white w-full" />
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={handleSaveMetric} className="flex-1 bg-primary h-10 rounded-lg">Salvar</Button>
                  <Button variant="ghost" onClick={() => setIsAddingMetric(false)} className="h-10 px-2">X</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evolution Chart */}
      {metrics.length > 0 && (
        <Card className="border-none shadow-sm bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Activity className="h-4 w-4" /> Evolução de Resultados
            </CardTitle>
            <select
              className="text-xs bg-muted border-none rounded-md px-2 py-1 outline-none"
              onChange={(e) => setSelectedMetricForChart(e.target.value)}
              value={selectedMetricForChart || activeMetrics[0]}
            >
              {activeMetrics.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  {chartData.length > 0 && chartData[0].refMin !== undefined && chartData[0].refMax !== undefined && (
                    <ReferenceArea
                      y1={chartData[0].refMin}
                      y2={chartData[0].refMax}
                      fill="hsl(var(--primary))"
                      fillOpacity={0.1}
                      strokeOpacity={0}
                    />
                  )}
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Results List */}
      {metrics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
            <ChartIcon className="h-4 w-4" /> Resultados Lançados
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
            {metrics.map(metric => (
              <LudicCard
                key={metric.id}
                title={metric.metric_name}
                icon={<ActivitySquare className="h-6 w-6" />}
                accentColor="bg-amber-100/50 border-amber-200"
                className="h-full"
              >
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <p className="text-2xl font-black text-amber-900 drop-shadow-sm">
                      {metric.value} <span className="text-xs font-semibold text-amber-700">{metric.unit}</span>
                    </p>
                    <p className="text-xs text-amber-800/80 font-medium mt-1">
                      {metric.date} {metric.reference_range && `| Ref: ${metric.reference_range}`}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-amber-200/50 pt-2">
                    <Button variant="ghost" size="icon" onClick={() => onDeleteMetric(metric.id)} className="h-7 w-7 text-amber-800 hover:text-red-600 hover:bg-red-100/50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </LudicCard>
            ))}
          </div>
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="text-sm font-bold text-muted-foreground uppercase flex items-center gap-2">
          <FileText className="h-4 w-4" /> Arquivos Anexados
        </h3>
        {documents.length === 0 ? (
          <p className="text-sm text-center text-muted-foreground py-4">Nenhum arquivo anexado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {documents.map((doc) => {
              const isImage = doc.name.toLowerCase().match(/\.(jpg|jpeg|png)$/i);
              return (
                <LudicCard
                  key={doc.id}
                  title={doc.name}
                  icon={isImage ? <FileImage className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                  accentColor="bg-blue-100/50 border-blue-200"
                  className="h-full"
                >
                  <div className="flex flex-col h-full justify-between gap-3">
                    <p className="text-xs text-blue-900/70 font-medium">
                      Anexado em: {doc.uploadedAt}
                    </p>
                    <div className="flex items-center justify-between border-t border-blue-200/50 pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg gap-2 text-blue-700 border-blue-300 hover:bg-blue-200/50"
                        onClick={() => window.open(`/api/documents/${doc.id}/view`, "_blank")}
                      >
                        <Download className="h-4 w-4" /> Abrir
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-800 hover:text-red-600 hover:bg-red-100/50"
                        onClick={() => onDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </LudicCard>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DocumentosTab;
