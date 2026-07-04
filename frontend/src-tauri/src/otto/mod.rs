//! Otto Scribe extensions to Meetily.
//!
//! All Otto-specific code lives under this module so the upstream Meetily
//! codebase stays mergeable (see `otto-scribe-brief.md`, engineering rule 1).
//!
//! Phase 1 ships the first Otto piece: a vault writer that exports a finished
//! meeting (raw transcript + summary) as a single Markdown note into the
//! Obsidian vault `Inbox/` folder (principle P7).

pub mod coach;
pub mod participants;
pub mod projects;
pub mod vault_writer;
