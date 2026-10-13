import { useEffect, useMemo, useRef, useState } from 'react';
import type { Actions } from '../_bridge/useMcpApp';
import { Quote as QuoteSchema, QuoteArguments, type Quote } from '../_shared/contracts';
import { parseWallTime } from '../_shared/format';

export function useQuoteEditor(initialData: Quote, initialArgs: QuoteArguments | null | undefined, actions: Actions) {
  const [current, setCurrent] = useState({ data: initialData, args: initialArgs ?? null });
  const [draft, setDraft] = useState<QuoteArguments | null>(initialArgs ?? null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const sequence = useRef(0);
  const dirty = JSON.stringify(draft) !== JSON.stringify(current.args);
  const options = Array.from(new Map([
    ...(initialData.included_coverages ?? []), ...(initialData.available_coverages ?? []),
    ...(current.data.included_coverages ?? []), ...(current.data.available_coverages ?? []),
  ].filter((option) => option.id && option.type).map((option) => [option.id!, option])).values());

  const validDraft = useMemo(() => {
    if (!draft) return null;
    const parsedArgs = QuoteArguments.safeParse(draft);
    const from = parseWallTime(`${draft.from_date}T${draft.from_date_time ?? '10:00'}`);
    const to = parseWallTime(`${draft.to_date}T${draft.to_date_time ?? '10:00'}`);
    const validExtras = (draft.extra_services ?? []).every((extra) => {
      const offered = current.data.available_extras?.find((option) => option.key === extra.key);
      return offered && (extra.quantity ?? 1) <= offered.price_by_quantity.length;
    });
    if (!parsedArgs.success || !from || !to || `${draft.to_date}T${draft.to_date_time ?? '10:00'}` <= `${draft.from_date}T${draft.from_date_time ?? '10:00'}` || !validExtras) return null;
    return parsedArgs.data;
  }, [draft, current.data.available_extras]);
  const invalid = dirty && !validDraft;

  useEffect(() => {
    setPending(false);
    if (!dirty || !validDraft) return;
    const request = ++sequence.current;
    const timer = setTimeout(() => {
      setPending(true);
      setFailed(false);
      void (async () => {
        try {
          const result = await actions.callServerTool('get_vehicle_quote', validDraft);
          const parsed = result && !result.isError ? QuoteSchema.safeParse(result.structuredContent) : null;
          if (request !== sequence.current) return;
          if (parsed?.success) {
            setCurrent({ data: parsed.data, args: validDraft });
            setDraft(validDraft);
          } else setFailed(true);
        } catch { if (request === sequence.current) setFailed(true); }
        finally { if (request === sequence.current) setPending(false); }
      })();
    }, 500);
    return () => { clearTimeout(timer); ++sequence.current; };
  }, [dirty, validDraft, retry, actions.callServerTool]);

  const update = (patch: Partial<QuoteArguments>) => {
    ++sequence.current;
    setPending(false);
    setFailed(false);
    setDraft((previous) => previous ? { ...previous, ...patch } : null);
  };

  const changeCoverage = (type: string, id: string) => {
    if (!draft) return;
    const previous = draft.covers ?? [];
    if (previous.some((selected) => !options.some((option) => option.id === selected))) { setFailed(true); return; }
    const sameType = new Set(options.filter((option) => option.type === type).map((option) => option.id));
    update({ covers: [...previous.filter((selected) => !sameType.has(selected)), id] });
  };

  return { current, draft, dirty, pending, failed, invalid, options, update, changeCoverage,
    retry: () => { setFailed(false); setRetry((value) => value + 1); },
    reset: () => { ++sequence.current; setPending(false); setDraft(current.args); setFailed(false); },
  };
}
