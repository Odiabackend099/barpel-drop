-- Fix get_dashboard_stats to handle NULL started_at
-- Root cause: Vapi doesn't always send call.startedAt in end-of-call-report.
-- Calls with NULL started_at were excluded from all dashboard stats because
-- NULL BETWEEN x AND y evaluates to NULL (falsy).
-- Fix: Use COALESCE(started_at, created_at) everywhere.

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_merchant_id UUID,
  p_date_from   TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  p_date_to     TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(

    'total_calls', (
      SELECT COUNT(*)
      FROM call_logs
      WHERE merchant_id = p_merchant_id
        AND COALESCE(started_at, created_at) BETWEEN p_date_from AND p_date_to
    ),

    'calls_by_type', (
      SELECT json_object_agg(call_type, cnt)
      FROM (
        SELECT COALESCE(call_type, 'general') AS call_type, COUNT(*) AS cnt
        FROM call_logs
        WHERE merchant_id = p_merchant_id
          AND COALESCE(started_at, created_at) BETWEEN p_date_from AND p_date_to
        GROUP BY call_type
      ) t
    ),

    'calls_by_sentiment', (
      SELECT json_object_agg(sentiment, cnt)
      FROM (
        SELECT COALESCE(sentiment, 'neutral') AS sentiment, COUNT(*) AS cnt
        FROM call_logs
        WHERE merchant_id = p_merchant_id
          AND COALESCE(started_at, created_at) BETWEEN p_date_from AND p_date_to
        GROUP BY sentiment
      ) t
    ),

    'avg_duration_seconds', (
      SELECT COALESCE(ROUND(AVG(duration_seconds))::INTEGER, 0)
      FROM call_logs
      WHERE merchant_id = p_merchant_id
        AND COALESCE(started_at, created_at) BETWEEN p_date_from AND p_date_to
    ),

    'credits_used', (
      SELECT COALESCE(SUM(ABS(amount)), 0)
      FROM credit_transactions
      WHERE merchant_id = p_merchant_id
        AND type = 'deduction'
        AND created_at BETWEEN p_date_from AND p_date_to
    ),

    'recent_calls', (
      SELECT json_agg(r)
      FROM (
        SELECT
          id,
          direction,
          caller_number,
          call_type,
          sentiment,
          duration_seconds,
          ai_summary,
          credits_charged,
          ended_reason,
          COALESCE(started_at, created_at) AS started_at
        FROM call_logs
        WHERE merchant_id = p_merchant_id
        ORDER BY COALESCE(started_at, created_at) DESC
        LIMIT 5
      ) r
    ),

    'daily_volume', (
      SELECT json_agg(d ORDER BY d.date)
      FROM (
        SELECT
          TO_CHAR(gs.date, 'YYYY-MM-DD') AS date,
          COALESCE(COUNT(cl.id), 0)      AS count
        FROM generate_series(
          (NOW() - INTERVAL '13 days')::DATE,
          NOW()::DATE,
          '1 day'::INTERVAL
        ) AS gs(date)
        LEFT JOIN call_logs cl
          ON DATE(COALESCE(cl.started_at, cl.created_at)) = gs.date
         AND cl.merchant_id = p_merchant_id
        GROUP BY gs.date
      ) d
    )

  ) INTO v_result;

  RETURN v_result;
END;
$$;
