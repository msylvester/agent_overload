export function ArtifactContent() {
  return (
    <artifactDefinition.content
      title={artifact.title}
      content={
        status === 'streaming' && recentDocumentPart?.content
          ? recentDocumentPart.content
          : getDocumentContentById(currentVersionIndex)
      }
      mode={mode}
      status={recentDocumentPart?.status ?? 'in_progress'}
      currentVersionIndex={currentVersionIndex}
      suggestions={[]}
      onSaveContent={saveContent}
      isInline={false}
      isCurrentVersion={isCurrentVersion}
      getDocumentContentById={getDocumentContentById}
      isLoading={isDocumentsFetching && !artifact.content}
      metadata={metadata}
      setMetadata={setMetadata}
    />
  );
}
