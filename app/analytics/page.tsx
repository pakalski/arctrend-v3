'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AnalyticsPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const
