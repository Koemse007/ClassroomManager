      </div>

      <Dialog open={!!removeStudentId} onOpenChange={(open) => !open && setRemoveStudentId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this student from the group? Their submissions and grades will remain.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveStudentId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => removeStudentMutation.mutate(removeStudentId!)}
              disabled={removeStudentMutation.isPending}
              data-testid="button-confirm-remove"
            >
              {removeStudentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Student"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>