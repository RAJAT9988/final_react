/**
 * Home page — post-setup app.
 * URL: /app/home
 */

import { Head } from '@/components/seo';
import { HomePage } from '@/features/home/components/home-page';

const HomeRoute = () => {
  return (
    <>
      <Head title="Home" />
      <HomePage />
    </>
  );
};

export default HomeRoute;
