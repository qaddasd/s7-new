"use client"
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ScheduleInput from "./schedule-input";
import { Label } from "@/components/ui/label";
import { Dialog as CustomDialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Program {
  id: string;
  name: string;
}

interface ScheduleEntry {
  day: string;
  time: string;
}

interface CreateKruzhokProps {
  onKruzhokCreated: () => void;
}

export default function CreateKruzhok({ onKruzhokCreated }: CreateKruzhokProps) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [isFetchingPrograms, setIsFetchingPrograms] = useState(true);
  const [description, setDescription] = useState("");
  
  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      setIsFetchingPrograms(true);
      const data = await apiFetch<Program[]>("/api/kruzhok/programs");
      setPrograms(data || []);
      if (data && data.length > 0) {
        setSelectedProgramId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    } finally {
      setIsFetchingPrograms(false);
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!selectedProgramId) {
        toast({ title: "Ошибка", description: "Пожалуйста, выберите программу.", variant: "destructive" as any });
        setIsSubmitting(false);
        return;
      }
      if (schedule.length === 0) {
        toast({ title: "Ошибка", description: "Пожалуйста, добавьте расписание.", variant: "destructive" as any });
        setIsSubmitting(false);
        return;
      }

      await apiFetch("/api/kruzhok", {
        method: "POST",
        body: JSON.stringify({ name, description, programId: selectedProgramId, schedule }),
      });
      toast({ title: "Успех", description: "Кружок успешно создан!" });
      onKruzhokCreated();
      setIsOpen(false);
      setName("");
      setDescription("");
      setSelectedProgramId(programs.length > 0 ? programs[0].id : "");
      setSchedule([]);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать кружок. Возможно, у вас нет активной подписки.",
        variant: "destructive" as any,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomDialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className=\"bg-green-500 text-white hover:bg-green-600\">Создать кружок</Button>
      </DialogTrigger>
      <DialogContent className=\"sm:max-w-[425px] bg-[#16161c] border-[#636370]/20 text-white\">
        <DialogHeader>
          <DialogTitle>Создать новый кружок</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className=\"space-y-4\">
          <div className="space-y-2">
            <Label htmlFor="name">Название кружка</Label>
            <Input id="name" placeholder="Название кружка" value={name} onChange={(e) => setName(e.target.value)} required className="bg-[#1e1e26] border-[#636370]/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание кружка</Label>
            <Textarea id="description" placeholder="Описание кружка" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-[#1e1e26] border-[#636370]/20 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="program">Программа (Методика)</Label>
            <Select value={selectedProgramId} onValueChange={setSelectedProgramId} disabled={isFetchingPrograms || programs.length === 0}>
              <SelectTrigger id="program" className="bg-[#1e1e26] border-[#636370]/20 text-white">
                <SelectValue placeholder={isFetchingPrograms ? "Загрузка программ..." : "Выберите программу"} />
              </SelectTrigger>
              <SelectContent className="bg-[#1e1e26] border-[#636370]/20 text-white">
                {programs.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {programs.length === 0 && !isFetchingPrograms && (
              <p className="text-sm text-red-400">Нет доступных программ. Обратитесь к администратору.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Расписание</Label>
            <ScheduleInput schedule={schedule} onChange={setSchedule} />
          </div>
          <Button type="submit" disabled={isSubmitting || programs.length === 0 || schedule.length === 0} className="w-full bg-[#00a3ff] text-black hover:bg-[#0088cc]">
            {isSubmitting ? 'Создание...' : 'Создать'}
          </Button>
        </form>
      </DialogContent>
    </CustomDialog>
  );
}
