import { useRef, useState } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import { Quote as QuoteSchema, QuoteArguments, type Quote } from '../_shared/contracts';
import { parseWallTime } from '../_shared/format';

export function useQuoteEditor(initialData: Quote, initialArgs: QuoteArguments | null | undefined, actions: Actions, onApplied?: (data: Quote, args: QuoteArguments) => void) {
  const [current, setCurrent] = useState({ data: initialData, args: initialArgs ?? null });
  const [draft, setDraft] = useState<QuoteArguments | null>(initialArgs ?? null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const sequence = useRef(0);
  const inFlight = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(current.args);
  const options = Array.from(new Map([
    ...(initialData.included_coverages ?? []), ...(initialData.available_coverages ?? []),
    ...(current.data.included_coverages ?? []), ...(current.data.available_coverages ?? []),
  ].filter((option) => option.id && option.type).map((option) => [option.id!, option])).values());

  const update = (patch: Partial<QuoteArguments>) => {
    if (!draft || inFlight.current) return;
    setDraft({ ...draft, ...patch });
    setInvalid(false);
  };

  const apply = async (args: QuoteArguments | null = draft) => {
    if (!args || inFlight.current) return;
    const parsedArgs = QuoteArguments.safeParse(args);
    const from = parseWallTime(`${args.from_date}T${args.from_date_time ?? '10:00'}`);
    const to = parseWallTime(`${args.to_date}T${args.to_date_time ?? '10:00'}`);
    const validExtras = (args.extra_services ?? []).every((extra) => {
      const offered = current.data.available_extras?.find((option) => option.key === extra.key);
      return offered && (extra.quantity ?? 1) <= offered.price_by_quantity.length;
    });
    if (!parsedArgs.success || !from || !to || `${args.to_date}T${args.to_date_time ?? '10:00'}` <= `${args.from_date}T${args.from_date_time ?? '10:00'}` || !validExtras) {
      setInvalid(true);
      return;
    }
    const request = ++sequence.current;
    inFlight.current = true;
    setPending(true);
    setFailed(false);
    setInvalid(false);
    try {
      const result = await actions.callServerTool('get_vehicle_quote', parsedArgs.data);
      const parsed = result && !result.isError ? QuoteSchema.safeParse(result.structuredContent) : null;
      if (request !== sequence.current) return;
      if (parsed?.success) {
        setCurrent({ data: parsed.data, args: parsedArgs.data });
        setDraft(parsedArgs.data);
        onApplied?.(parsed.data, parsedArgs.data);
      } else setFailed(true);
    } catch { setFailed(true); }
    finally { if (request === sequence.current) { inFlight.current = false; setPending(false); } }
  };

  const changeCoverage = (type: string, id: string) => {
    if (!draft || inFlight.current) return;
    const previous = draft.covers ?? [];
    if (previous.some((selected) => !options.some((option) => option.id === selected))) { setFailed(true); return; }
    const sameType = new Set(options.filter((option) => option.type === type).map((option) => option.id));
    const args = { ...draft, covers: [...previous.filter((selected) => !sameType.has(selected)), id] };
    if (dirty) setDraft(args);
    else void apply(args);
  };

  return { current, draft, dirty, pending, failed, invalid, options, update, apply, changeCoverage, reset: () => { setDraft(current.args); setFailed(false); setInvalid(false); } };
}
