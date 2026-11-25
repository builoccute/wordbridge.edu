-- =============================================================================
-- Migration: 0002_language_intelligence_15_systems.sql
-- Project: WORD BRIDGE (https://www.wordbridge.vn/)
-- Purpose: Dedicated tables & telemetry structures for the 15 Differentiating
--          Language Intelligence Systems (Privacy-safe, never uses Learner Meet)
-- =============================================================================

PRAGMA foreign_keys = ON;

-- Master Registry of the 15 Language Intelligence Systems
CREATE TABLE IF NOT EXISTS language_intelligence_systems (
    system_number INTEGER PRIMARY KEY CHECK (system_number BETWEEN 1 AND 15),
    system_slug TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_vi TEXT NOT NULL,
    objective_vi TEXT NOT NULL,
    target_audience_vi TEXT NOT NULL,
    input_schema_json TEXT NOT NULL,
    output_schema_json TEXT NOT NULL,
    algorithm_method TEXT NOT NULL,
    privacy_rule_vi TEXT NOT NULL,
    requires_external_ai_adapter INTEGER NOT NULL DEFAULT 0,
    is_enabled INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 1: Language DNA (Multi-dimensional competence vectors)
CREATE TABLE IF NOT EXISTS li_language_dna_profiles (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    lexical_score REAL NOT NULL DEFAULT 0,
    grammatical_score REAL NOT NULL DEFAULT 0,
    phonetic_score REAL NOT NULL DEFAULT 0,
    pragmatic_score REAL NOT NULL DEFAULT 0,
    fluency_score REAL NOT NULL DEFAULT 0,
    comprehension_depth_score REAL NOT NULL DEFAULT 0,
    vector_json TEXT NOT NULL DEFAULT '{}',
    computed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(account_id, language_code)
);

-- System 2: Language Transfer Lab (Cross-linguistic interference & positive transfer)
CREATE TABLE IF NOT EXISTS li_transfer_analyses (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    source_language TEXT NOT NULL,
    target_language TEXT NOT NULL REFERENCES languages(code),
    sample_text TEXT NOT NULL,
    positive_transfers_json TEXT NOT NULL DEFAULT '[]',
    negative_interferences_json TEXT NOT NULL DEFAULT '[]',
    transfer_index REAL NOT NULL DEFAULT 0,
    remediation_vi TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 3: Knowledge-to-Language (Domain concept mapping for Chinese & English)
CREATE TABLE IF NOT EXISTS li_knowledge_domain_nodes (
    id TEXT PRIMARY KEY,
    domain_code TEXT NOT NULL,
    domain_name_vi TEXT NOT NULL,
    concept_key TEXT NOT NULL,
    term_zh TEXT,
    pinyin_zh TEXT,
    term_en TEXT,
    ipa_en TEXT,
    explanation_vi TEXT NOT NULL,
    task_scenario_json TEXT NOT NULL DEFAULT '{}',
    UNIQUE(domain_code, concept_key)
);

-- System 4: Real-World Language Simulator (Multi-step branching state machine)
CREATE TABLE IF NOT EXISTS li_simulator_runs (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    scenario_code TEXT NOT NULL,
    current_step INTEGER NOT NULL DEFAULT 1,
    state_history_json TEXT NOT NULL DEFAULT '[]',
    pragmatic_appropriateness REAL NOT NULL DEFAULT 0,
    task_completion_score REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 5: Language Error Genome (Root-cause taxonomy of recurring errors)
CREATE TABLE IF NOT EXISTS li_error_genome_records (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    error_gene_code TEXT NOT NULL,
    error_category TEXT NOT NULL CHECK (error_category IN ('SYNTAX', 'MORPHOLOGY', 'LEXICAL_CHOICE', 'TONE_PHONOLOGY', 'CASE_ASPECT', 'COLLOCATION')),
    root_cause_vi TEXT NOT NULL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    recurrence_rate REAL NOT NULL DEFAULT 0,
    targeted_drill_json TEXT NOT NULL DEFAULT '{}',
    last_detected_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(account_id, language_code, error_gene_code)
);

-- System 6: Meaning Equivalence Engine (Nuance, register & pragmatic equivalence)
CREATE TABLE IF NOT EXISTS li_meaning_equivalences (
    id TEXT PRIMARY KEY,
    concept_slug TEXT NOT NULL UNIQUE,
    expression_zh TEXT NOT NULL,
    expression_en TEXT NOT NULL,
    expression_ru TEXT NOT NULL,
    register_level TEXT NOT NULL CHECK (register_level IN ('FORMAL', 'NEUTRAL', 'INFORMAL', 'ACADEMIC', 'TECHNICAL')),
    semantic_divergence_vi TEXT NOT NULL,
    pragmatic_notes_json TEXT NOT NULL DEFAULT '{}'
);

-- System 7: Language Timeline (Longitudinal competence trajectory snapshots)
CREATE TABLE IF NOT EXISTS li_timeline_snapshots (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    snapshot_date TEXT NOT NULL,
    composite_index REAL NOT NULL,
    vocabulary_size_est INTEGER NOT NULL DEFAULT 0,
    accuracy_rate REAL NOT NULL DEFAULT 0,
    velocity_delta REAL NOT NULL DEFAULT 0,
    milestone_note_vi TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 8: Universal Pronunciation Lab (Phonetic, tonal & stress evaluation)
CREATE TABLE IF NOT EXISTS li_pronunciation_evaluations (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    target_phrase TEXT NOT NULL,
    recognized_transcript TEXT NOT NULL,
    phoneme_accuracy REAL NOT NULL,
    prosody_tone_score REAL NOT NULL,
    stress_rhythm_score REAL NOT NULL,
    diagnostic_details_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 9: Multi-Language Knowledge Graph (Tri-lingual zh-en-ru graph edges)
CREATE TABLE IF NOT EXISTS li_knowledge_graph_edges (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    label_vi TEXT NOT NULL,
    node_zh TEXT NOT NULL,
    node_en TEXT NOT NULL,
    node_ru TEXT NOT NULL,
    relation_type TEXT NOT NULL CHECK (relation_type IN ('SYNONYM', 'PREREQUISITE', 'STRUCTURAL_CONTRAST', 'DOMAIN_LINK')),
    linked_node_id TEXT NOT NULL,
    contrastive_note_vi TEXT NOT NULL
);

-- System 10: Personal Language Corpus (Learner's own verified utterances & writings)
CREATE TABLE IF NOT EXISTS li_personal_corpus_entries (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    source_type TEXT NOT NULL CHECK (source_type IN ('WRITING_EXERCISE', 'PRACTICE_DRILL', 'EXAM_RESPONSE')),
    content_text TEXT NOT NULL,
    token_count INTEGER NOT NULL DEFAULT 0,
    unique_lemmas INTEGER NOT NULL DEFAULT 0,
    lexical_density REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 11: Context Reconstruction (Pragmatic context restoration exercises)
CREATE TABLE IF NOT EXISTS li_context_reconstructions (
    id TEXT PRIMARY KEY,
    language_code TEXT NOT NULL REFERENCES languages(code),
    fragment_text TEXT NOT NULL,
    missing_context_clues_json TEXT NOT NULL,
    expected_register TEXT NOT NULL,
    expected_speaker_intent TEXT NOT NULL,
    reconstructed_exemplar TEXT NOT NULL,
    explanation_vi TEXT NOT NULL
);

-- System 12: Comprehension Depth Test (Literal, inferential, pragmatic & critical layers)
CREATE TABLE IF NOT EXISTS li_comprehension_depth_attempts (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    passage_id TEXT NOT NULL,
    literal_score REAL NOT NULL,
    inferential_score REAL NOT NULL,
    pragmatic_implicature_score REAL NOT NULL,
    critical_synthesis_score REAL NOT NULL,
    depth_index REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 13: Learning Recovery System (Ebbinghaus decay detection & recovery micro-sessions)
CREATE TABLE IF NOT EXISTS li_learning_recovery_queue (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    item_type TEXT NOT NULL CHECK (item_type IN ('VOCABULARY', 'GRAMMAR', 'LESSON_CONCEPT')),
    item_ref_id TEXT NOT NULL,
    retention_probability REAL NOT NULL,
    decay_severity TEXT NOT NULL CHECK (decay_severity IN ('MILD', 'MODERATE', 'CRITICAL')),
    recovery_plan_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RECOVERED')),
    detected_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 14: Language Quality Benchmark (Accuracy, naturalness & register fit scoring)
CREATE TABLE IF NOT EXISTS li_quality_benchmarks (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    submitted_text TEXT NOT NULL,
    target_register TEXT NOT NULL,
    grammatical_accuracy REAL NOT NULL,
    idiomatic_naturalness REAL NOT NULL,
    register_appropriateness REAL NOT NULL,
    cohesion_score REAL NOT NULL,
    composite_benchmark REAL NOT NULL,
    suggestions_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- System 15: Personal Language Observatory (Unified telemetry & next-best-action engine)
CREATE TABLE IF NOT EXISTS li_observatory_reports (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL REFERENCES languages(code),
    readiness_index REAL NOT NULL,
    top_strengths_json TEXT NOT NULL DEFAULT '[]',
    bottlenecks_json TEXT NOT NULL DEFAULT '[]',
    recommended_actions_json TEXT NOT NULL DEFAULT '[]',
    generated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(account_id, language_code)
);
