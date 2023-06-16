export default function Loading() {
    // You can add any UI inside Loading, including a Skeleton.
    console.log("LOADING2");
    return (
        <div
            role="status"
            className="w-[80vw] animate-pulse flex justify-center items-center mx-auto"
        >
            <div className="h-[80vh] w-[80vw] lg:w-[50vw] bg-gray-200 rounded-md dark:bg-gray-700 mt-10"></div>
        </div>
    );
}
