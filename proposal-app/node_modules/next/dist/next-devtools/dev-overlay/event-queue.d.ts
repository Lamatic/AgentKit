export declare class EventQueue<Dispatch> {
    private dispatch;
    private readonly queue;
    enqueue(event: (dispatch: Dispatch) => void): void;
    connect(dispatch: Dispatch): void;
    disconnect(dispatch: Dispatch): void;
}
